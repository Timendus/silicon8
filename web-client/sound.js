let gainNode;

module.exports = {
  playSound: () => {
    setVolume(0.1);
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

  const oscillator = audioCtx.createOscillator();
  gainNode = audioCtx.createGain();

  gainNode.gain.value = 0;
  oscillator.frequency.value = 600;
  oscillator.type = 'triangle';

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start();
}
