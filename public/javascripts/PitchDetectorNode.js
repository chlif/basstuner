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
	var sampleRate; // This holds universally on a single computer
	var processorBufferSize = 4096;
	var buffer = [];
	var maxBufferTime = 250; // in ms
	var maxBufferLength;
	var correlations = {};
	var frequencies = {};

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

	/**
	 * Periodic update of correlations
	 */
	function _updateCorrelations(input) {
		for (var key in frequencies) {	
			var f = frequencies[key];
			correlations[key] = _correlation( f, input );
		}
	}

	// Gather buffer and run actual update periodically
	function _countCorrelationsForFrequencies(inputBuffer) {
		var input = inputBuffer.getChannelData(0);
		buffer = buffer.concat( Array.prototype.slice.call( input ) );
		if (buffer.length > maxBufferLength) {
			_updateCorrelations(buffer.slice());
			buffer = [];	
		}
	}

	/**
	 *	Pitch detector node
	 */
	function PitchDetectorNode(audioContext) {
		this.onaudioprocess = function(event) {
			_passInputToOutput(event.inputBuffer, event.outputBuffer);
			_countCorrelationsForFrequencies(event.inputBuffer);
		};
	}

	/**
	 *	Publish PicthDetectorNode through AudioContext
	 */

	// We need the factor to make the node look like a native library
	function PitchDetectorNodeFactory(audioContext) {
		var script = audioContext.createScriptProcessor(processorBufferSize, 1, 1);
		
		sampleRate = audioContext.sampleRate;
		maxBufferLength = maxBufferTime * processorBufferSize / (sampleRate / 1000);
		PitchDetectorNode.call(script, audioContext);

		script.setFrequencies = function(freqs) {
			frequencies = freqs;
		};
		script.getCorrelations = function() {
			return correlations;
		};

		return script;
	}

	// Publish the node to API
	AudioContext.prototype.createPitchDetector = function() {
		return PitchDetectorNodeFactory(this);
	};

})();