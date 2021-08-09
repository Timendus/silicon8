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
    playSound ||= () => {};
    stopSound ||= () => {};

    Object.assign(go.importObject.env, {
      'main.randomByte': () => Math.floor(Math.random() * 256) & 0xFF,
      'main.playSound':  playSound,
      'main.stopSound':  stopSound,
      'main.render': (width, height, dataPtr) => {
        const bytes = new Uint8Array(this._cpu.memory.buffer, dataPtr, width * height / 8);
        display.render(width, height, bytes);
      }
    });
  }

  init() {
    return WebAssembly.instantiateStreaming(fetch("silicon8.wasm"), go.importObject)
    .then(result => {
      this._cpu = result.instance.exports;
      go.run(result.instance);
      setInterval(() => this._cpu.clockTick(), 1000 / 60);
    })
    .catch(e => {
      console.error(e);
    });
  }

  setCyclesPerFrame(newCycles) {
    this._cpu.setCyclesPerFrame(newCycles);
  }

  loadProgram(type, program) {
    this._cpu.reset(type);
    const ram = new Uint8Array(this._cpu.memory.buffer, this._cpu.ramPtr(), this._cpu.ramSize());
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
