// This is just a wrapper for all the WebAssembly stuff.

// require('./wasm_exec.js');
const font = require('../shared/font');
const go = new Go();

if (!WebAssembly.instantiateStreaming) { // polyfill
  WebAssembly.instantiateStreaming = async (resp, importObject) => {
    const source = await (await resp).arrayBuffer();
    return await WebAssembly.instantiate(source, importObject);
  };
}

module.exports = class {

  constructor({playSound, stopSound, display}) {
    this._cyclesPerFrame = 30;
    this._display = display;
    playSound ||= () => {};
    stopSound ||= () => {};

    Object.assign(go.importObject.env, {
      'main.randomByte': () => Math.floor(Math.random() * 256) & 0xFF,
      'main.playSound':  playSound,
      'main.stopSound':  stopSound,
      'main.setDisplaySize': display.setSize
    });
  }

  init() {
    return WebAssembly.instantiateStreaming(fetch("silicon8.wasm"), go.importObject)
    .then(result => {
      this._cpu = result.instance.exports;
      go.run(result.instance);
      const display = new Uint8Array(this._cpu.memory.buffer, this._cpu.displayPtr(), this._cpu.displaySize());

      setInterval(() => {
        this._cpu.cycles(this._cyclesPerFrame);
        if ( this._cpu.screenDirty() ) {
          this._display.render(display);
          this._cpu.setScreenClean();
        }
      }, 1000 / 60);
    })
    .catch(e => {
      console.error(e);
    });
  }

  setCyclesPerFrame(newCycles) {
    this._cyclesPerFrame = newCycles;
  }

  loadProgram(type, program) {
    this._cpu.initialize(type);
    const ram = new Uint8Array(this._cpu.memory.buffer, this._cpu.ramPtr(), this._cpu.ramSize());
    // Clear RAM
    const ramSize = this._cpu.ramSize();
    for ( let i = 0; i < ramSize; i++ ) ram[i] = 0;
    // Load font and program into RAM
    const fontData = font(type);
    for ( let i = 0; i < fontData.length; i++ ) ram[i] = fontData[i];
    for ( let i = 0x200; i < 0x200 + program.length; i++ ) ram[i] = program[i - 0x200];
  }

  dumpStatus() {
    this._cpu.dumpStatus();
  }

  pressKey(key) {
    this._cpu.pressKey(key);
  }

  releaseKey(key) {
    this._cpu.releaseKey(key);
  }

}
