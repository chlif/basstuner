(function() {

	// Check that AudioContext is available
	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	if (window.AudioContext === undefined) {
		throw "No getUserMedia or AudioContext available in your browser";
	}

	// If PitchDetectorNode has already been initialized, throw an expception
	if (typeof AudioContext.createPitchDetectorNode === 'function') {
		throw "Pitch detection already intiialized.";
	}

	/**
	 * Values
	 */
	var sampleRate; // This holds universally on a single computer.

	/**
	 *	Helper functions
	 */

	// Copy input to output without any changes
	function _passInputToOutput(inputBuffer, outputBuffer) {
		var input = inputBuffer.getChannelData(0);
		var output = outputBuffer.getChannelData(0);
		for (var sample = 0; sample < inputBuffer.length; sample++) {
			output[sample] = input[sample];
		}
	}

	// Count the hypotenuse of the two correlations
	function _hypotenuse(a, b) {
		return Math.sqrt( a*a + b*b );
	}

	// Calculate correlation for individual frequency
	function _correlation(frequency, signal) {
		var real = 0;
		var imag = 0;
		for (var n = 0; n < signal.length; n++) {
			real += signal[n] * Math.cos( 2 * Math.PI * frequency * n / sampleRate);
			imag += signal[n] * Math.sin( 2 * Math.PI * frequency * n / sampleRate);
		}
		return _hypotenuse(real, imag);
	}

	// The actual magic behind it all
	function _countCorrelationsForFrequencies(inputBuffer, frequencies) {
		var input = inputBuffer.getChannelData(0);
		
		for (var i in frequencies) {
			var f = frequencies[i];
			console.log( _correlation( f, input ) );
		}	
	}

	/**
	 *	Pitch detector node
	 */
	function PitchDetectorNode(audioContext, frequencies) {
		this.onaudioprocess = function(event) {
			_passInputToOutput(event.inputBuffer, event.outputBuffer);
			_countCorrelationsForFrequencies(event.inputBuffer, frequencies);
		};
	}

	/**
	 *	Publish PicthDetectorNode through AudioContext
	 */

	// We need the factor to make the node look like a native library
	function PitchDetectorNodeFactory(audioContext, frequencies) {
		var scriptProcess = audioContext.createScriptProcessor(4096, 1, 1);
		sampleRate = audioContext.sampleRate;
		PitchDetectorNode.call(scriptProcess, audioContext, frequencies);
		return scriptProcess;
	}

	// Publish the node to API
	AudioContext.prototype.createPitchDetector = function(frequencies) {
		return PitchDetectorNodeFactory(this, frequencies);
	};

})();