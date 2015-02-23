(function() {
	var audioContext  = new AudioContext();
	var oscillator = audioContext.createOscillator();

	oscillator.type = oscillator.SINE;
	oscillator.frequency.value = 440;

	oscillator.connect( audioContext.destination );

	oscillator.start();
	oscillator.stop(2);
})();