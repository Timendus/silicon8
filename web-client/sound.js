module.exports = {
  playSound: (playingPattern, pattern, pitch) => {
    if ( playingPattern ) {
      // Play XO-Chip `pattern` at `pitch`
      Bleeps.instance().setToSound(pattern, pitch);
      Bleeps.instance().setVolume(0.0003);
    } else {
      // Play a regular old CHIP-8 "beep"
      Bleeps.instance().setToBleep();
      Bleeps.instance().setVolume(0.1);
    }
  },
  stopSound: () => {
    Bleeps.instance().setVolume(0);
  }
};

class Bleeps {
  constructor() {
    this._audioCtx = new (window.AudioContext || window.webkitAudioContext || window.audioContext);

    this._oscillator = this._audioCtx.createOscillator();
    this._gainNode = this._audioCtx.createGain();
    this._oscillator.connect(this._gainNode);
    this._gainNode.connect(this._audioCtx.destination);

    this.setVolume(0);
    this._oscillator.start();
  }

  setVolume(gain) {
    this._gainNode.gain.value = gain;
  }

  setToBleep() {
    this._oscillator.frequency.value = 600;
    this._oscillator.type = 'triangle';
  }

  setToSound(pattern, pitch) {
    // Honestly, I had no idea how to go from a pattern and a pitch to some
    // sound in the browser. Luckily Kouzeru reached out and helped me by
    // supplying the FFT magic at the bottom of this class! Thanks so much!
    this._oscillator.setPeriodicWave(
      this._periodicWave(this._patternToBits(pattern))
    );
    // 128 is a magic number 🪄, discovered by trial and error, comparing the
    // sound to Octo and a little educated guesswork. It matches the number of
    // one-bit samples in 16 bytes, which is why we think it's correct.
    this._oscillator.frequency.value = pitch / 128;
  }

  // Extend the pattern to an array of individual bits, quadrupling each bit to
  // get a nicer square wave
  _patternToBits(pattern) {
    const bits = new Float32Array(512);
    let i = 0;
    for ( const byte of pattern ) {
      let mask = 128;
      while ( mask != 0 ) {
        const val = (byte & mask) != 0 ? 1 : 0;
        bits[i++] = val;
        bits[i++] = val;
        bits[i++] = val;
        bits[i++] = val;
        mask >>= 1;
      }
    }
    return bits;
  }

  // Convert the bit pattern to a wave that makes sense to the oscillator
  _periodicWave(samplesR) {
    var samplesI = new Float32Array(samplesR.length);
    var FFTresult = this._FFT(samplesR, samplesI);
    return this._audioCtx.createPeriodicWave(
      FFTresult[0].slice(0,FFTresult[0].length/2),
      FFTresult[1].slice(0,FFTresult[1].length/2),
      { disableNormalization: true }
    );
  }

  // Fast Fourier Transform, implemented in JavaScript by Kouzeru
  // (https://github.com/Kouzeru) based on the pseudocode in
  // https://youtu.be/h7apO7q16V0
  _FFT(R,I) {
    var n = R.length;
    if (n == 1) return [R,I];
    var Wr = Math.cos(2*Math.PI/n);
    var Wi = Math.sin(2*Math.PI/n);
    var PEr = new Float32Array(n/2);
    var PEi = new Float32Array(n/2);
    var POr = new Float32Array(n/2);
    var POi = new Float32Array(n/2);
    for (var z = 0; z<n; z++) {
      if (z&1) {
        POr[z>>1] = R[z];
        POi[z>>1] = I[z];
      } else {
        PEr[z>>1] = R[z];
        PEi[z>>1] = I[z];
      }
    }

    var ye = this._FFT(PEr,PEi);
    var yo = this._FFT(POr,POi);
    var yer = ye[0], yei = ye[1];
    var yor = yo[0], yoi = yo[1];
    var yr = new Float32Array(n);
    var yi = new Float32Array(n);

    for (var z = 0, m = n/2, p = 1, q = 0, r = 0; z<m; z++) {
      var a = yer[z], b = yei[z];
      var c = yor[z], d = yoi[z];
      yr[z  ] = a + p*c - q*d;
      yi[z  ] = b + p*d + q*c;
      yr[z+m] = a - p*c + q*d;
      yi[z+m] = b - p*d - q*c;
      r = p*Wr - q*Wi;
      q = p*Wi + q*Wr;
      p=r;
    }
    return [yr,yi];
  }
}

// Sound may only play after a "user gesture", so we can't just create a single
// instance of Bleeps on page load. So we use a singleton pattern here instead,
// "lazy loading" the instance as late as possible.
Bleeps.instance = () => {
  if (!!Bleeps._instance) return Bleeps._instance;
  return Bleeps._instance = new Bleeps();
}
