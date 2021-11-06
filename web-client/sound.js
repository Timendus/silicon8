let gainNode, oscillator;

module.exports = {
  playSound: (playingPattern, pattern, pitch) => {
    if ( playingPattern ) {
      // Play XO-Chip pattern at pitch
      // Honestly, I have no idea how to go from a pattern and a pitch to some
      // sound in the browser. So this is a TODO. Disable sound for now it we
      // use XO-Chip sound (because otherwise it's just annoying).

      // This makes interesting noises, but is not the real deal:
      // setVolume(0.1);
      // oscillator.frequency.value = pitch / 4;
    } else {
      setVolume(0.1);
    }
  },
  stopSound: () => {
    setVolume(0);
  }
};

function setVolume(gain) {
  // Sound may only play after a "user gesture", so do it this way:
  if ( !gainNode ) setupSound();
  gainNode.gain.value = gain;
}

function setupSound() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext || window.audioContext);

  oscillator = audioCtx.createOscillator();
  gainNode = audioCtx.createGain();

  gainNode.gain.value = 0;
  oscillator.frequency.value = 600;
  oscillator.type = 'triangle';

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start();
}
