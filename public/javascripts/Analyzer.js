(function() {

	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
	window.AudioContext = window.AudioContext || window.webkitAudioContext;

	if (navigator.getUserMedia === undefined || window.AudioContext === undefined) {
		throw "No getUserMedia or AudioContext available in your browser";
	}

	navigator.getUserMedia({ video: false, audio: true },
		function success(localMediaStream) {
			var audioContext = new AudioContext();
			var mediaStreamSource = audioContext.createMediaStreamSource( localMediaStream );
			var analyzer = audioContext.createAnalyser();
			var pitchDetector = audioContext.createPitchDetector( [55] );

			var canvas = document.getElementById('tuner-screen');
			var canvasContext = canvas.getContext('2d');
			
			analyzer.fftSize =  2048;
			var bufferLength = analyzer.frequencyBinCount;
			var dataArray = new Uint8Array(bufferLength);
			var sampleRate = audioContext.sampleRate;
			var frequencyStep = sampleRate / (2 * bufferLength);

			mediaStreamSource.connect(pitchDetector);
			pitchDetector.connect(analyzer);
			//analyzer.connect(audioContext.destination);

			function draw() {

				drawVisual = requestAnimationFrame(draw);

				analyzer.getByteFrequencyData(dataArray);

				canvasContext.fillStyle = 'rgb(200, 200, 200)';
				canvasContext.fillRect(0, 0, 400, 200);

				canvasContext.lineWidth = 1;
				canvasContext.strokeStyle = 'rgb(0, 0, 0)';

				canvasContext.beginPath();

				var sliceWidth = 400.0 / bufferLength;
				var x = 0;

				for (var i = 0; i < bufferLength; i++) {
					var v = dataArray[i] / 128.0;
					var y = 200 - v * 100;
					if (i === 0) {
						canvasContext.moveTo(x,y);
					} else {
						canvasContext.lineTo(x,y);
					}
					x += sliceWidth;
				}

				canvasContext.lineTo(canvas.width, canvas.height/2);
				canvasContext.stroke();

			}

			draw();

		},
		function fail(e) {
			throw e;
		});

})()