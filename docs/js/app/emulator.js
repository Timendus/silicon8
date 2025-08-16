// This is just a wrapper for all the WebAssembly stuff.

import "../lib/wasm_exec.js";
const go = new Go();

if (!WebAssembly.instantiateStreaming) {
  // polyfill
  WebAssembly.instantiateStreaming = async (resp, importObject) => {
    const source = await (await resp).arrayBuffer();
    return await WebAssembly.instantiate(source, importObject);
  };
}

export default class {
  constructor({ playSound, stopSound, display }) {
    playSound ||= () => {};
    stopSound ||= () => {};
    this._running = false;
    this._stopSound = stopSound;

    Object.assign(go.importObject.env, {
      randomByte: () => Math.floor(Math.random() * 256) & 0xff,
      playSound: (playingPattern, pattern, pitch) => {
        pattern = new Uint8Array(this._cpu.memory.buffer, pattern, 16);
        playSound(playingPattern, pattern, pitch);
      },
      stopSound: stopSound,
      render: (width, height, dataPtr) => {
        const bytes = new Uint8Array(
          this._cpu.memory.buffer,
          dataPtr,
          width * height * 3
        );
        display.render(width, height, bytes);
      },
    });
  }

  init() {
    return WebAssembly.instantiateStreaming(
      fetch("silicon8.wasm"),
      go.importObject
    )
      .then((result) => {
        this._cpu = result.instance.exports;
        go.run(result.instance);
        this._interval = setInterval(() => {
          if (this._running) this._cpu.clockTick();
        }, 1000 / 60);
      })
      .catch((e) => {
        console.error(e);
      });
  }

  setCyclesPerFrame(newCycles) {
    this._cpu.setCyclesPerFrame(newCycles);
  }

  loadProgram(type, program) {
    this._cpu.reset(type);
    const ram = new Uint8Array(
      this._cpu.memory.buffer,
      this._cpu.ramPtr(),
      this._cpu.ramSize()
    );
    // Load program into RAM
    for (let i = 0x200; i < 0x200 + program.length; i++)
      ram[i] = program[i - 0x200];
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

  start() {
    this._running = true;
  }

  stop() {
    this._stopSound();
    this._running = false;
  }
}
