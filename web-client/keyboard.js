module.exports = class Keyboard {

  constructor(instance) {
    if (!instance) throw 'Keyboard requires an emulator instance to run';
    this._instance = instance;
    this._attachEventListeners();
  }

  setMapping(keymap) {
    this._keymap = keymap;
  }

  _attachEventListeners() {
    window.addEventListener('keydown', e => this._keydownListener(e));
    window.addEventListener('keyup', e => this._keyupListener(e));
    for (const button of document.querySelectorAll('.keyboard button')) {
      button.addEventListener('touchstart',
        () => instance.pressKey(button.dataset.value),
        { passive: true }
      );
      button.addEventListener('touchend',
        () => instance.releaseKey(button.dataset.value),
        { passive: true }
      );
    }
  }

  _keydownListener(e) {
    if (e.code == "Enter")
      return this._instance.dumpStatus();
    if (e.code in this._fixedKeys)
      this._instance.pressKey(this._fixedKeys[e.code]);
    if (e.code in this._gamepadKeys && this._keymap) {
      const key = parseInt(this._keymap[this._gamepadKeys[e.code]]);
      if (!isNaN(key)) this._instance.pressKey(key);
    }
  }

  _keyupListener(e) {
    if (e.code in this._fixedKeys)
      this._instance.releaseKey(this._fixedKeys[e.code]);
    if (e.code in this._gamepadKeys && this._keymap) {
      const key = parseInt(this._keymap[this._gamepadKeys[e.code]]);
      if (!isNaN(key)) this._instance.releaseKey(key);
    }
  }

  _fixedKeys = {
    // 16 key pad
    "Digit1": 1,
    "Digit2": 2,
    "Digit3": 3,
    "Digit4": 0xC,
    "KeyW":   5,
    "KeyQ":   4,
    "KeyE":   6,
    "KeyR":   0xD,
    "KeyA":   7,
    "KeyS":   8,
    "KeyD":   9,
    "KeyF":   0xE,
    "KeyZ":   0xA,
    "KeyX":   0,
    "KeyC":   0xB,
    "KeyV":   0xF,
  
    // Other number keys
    "Digit5": 5,
    "Digit6": 6,
    "Digit7": 7,
    "Digit8": 8,
    "Digit9": 9,
    "Digit0": 0,
  }

  _gamepadKeys = {
    // Arrow keys
    "ArrowUp": "up",
    "ArrowDown": "down",
    "ArrowLeft": "left",
    "ArrowRight": "right",

    // Vim bindings
    "KeyK": "up",
    "KeyJ": "down",
    "KeyH": "left",
    "KeyL": "right",
  
    // Action button A
    "Space": "a",
    "ControlLeft": "a",
    "ControlRight": "a",
    "MetaLeft": "a",
    "MetaRight": "a",

    // Action button B
    "ShiftLeft": "b",
    "ShiftRight": "b",
    "AltLeft": "b",
    "AltRight": "b"
  }

}
