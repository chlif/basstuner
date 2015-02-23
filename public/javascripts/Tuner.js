(function() {

	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
	window.AudioContext = window.AudioContext || window.webkitAudioContext;

	if (navigator.getUserMedia === undefined || window.AudioContext === undefined) {
		throw "No getUserMedia or AudioContext available in your browser";
	}

	var frequencies = {
		'E1': 41.204,
		'A1': 55.000,
		'D2': 73.416,
		'G2': 97.999
	};
	var strings = ['E1', 'A1', 'D2', 'G2'];

	var lights = {
		low: document.getElementById('low-freq-light'),
		string: document.getElementById('string-freq-light'),
		high: document.getElementById('high-freq-light')
	};

	function setFrequency(detector, key) {
		detector.setFrequencies({
			'low': frequencies[key] - 2,
			'string': frequencies[key],
			'high': frequencies[key] + 2
		});
		lights.string.innerHTML = key;
	}

	navigator.getUserMedia({ video: false, audio: true },
		function success(localMediaStream) {
			var audioContext = new AudioContext();
			var mediaStreamSource = audioContext.createMediaStreamSource( localMediaStream );
			var gain = audioContext.createGain();
			var pitchDetector = audioContext.createPitchDetector();
			var analyser = audioContext.createAnalyser();
			var cutoffCorrelation = 30;
			var string = 'E1';

			analyser.fftSize = 2048;
			gain.gain.value = 5;

			mediaStreamSource.connect(gain);
			gain.connect(pitchDetector);
			pitchDetector.connect(analyser);

			setFrequency(pitchDetector, string);
			document.getElementById('lower-freq-btn').onclick = function() {
				if (strings.indexOf(string)-1 > -1) {
					string = strings[strings.indexOf(string)-1];
					setFrequency(pitchDetector, string);
					gain.gain.value = (string.length - strings.indexOf(string)) + 1;
				}
			};
			document.getElementById('higher-freq-btn').onclick = function() {
				if (strings.indexOf(string)+1 < strings.length) {
					string = strings[strings.indexOf(string)+1];
					setFrequency(pitchDetector, string);
					gain.gain.value = (strings.length - strings.indexOf(string)) + 1;
				}
			};
			
			(function updateScreen() {
				var correlations = pitchDetector.getCorrelations();

				for (var key in correlations) {
					var correlation = (correlations[key] < cutoffCorrelation) ? correlations[key] : cutoffCorrelation;
					r = 255 - Math.round(correlation / cutoffCorrelation * 255);

					lights[key].style.backgroundColor = 'rgb('+r+',240,0)';
				}

				setTimeout(updateScreen, 100);
			})();

		},
		function fail(e) {
			throw e;
		});

})()