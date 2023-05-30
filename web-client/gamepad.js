const Notification = require('./notification');

module.exports = class Gamepad {

  constructor(instance) {
    if (!instance) throw 'Keyboard requires an emulator instance to run';
    this._instance = instance;
    this._gamepads = {};
    this._unannouncedGamepads = [];
    this._keymap = {};
    this._running = false;
    this._waiting = false;
    this._attachEventListeners();
  }

  setMapping(keymap) {
    this._keymap = keymap;
  }

  getNextButtonPress() {
    return new Promise((resolve, _) => {
      this._waiting = resolve;
    });
  }

  present() {
    return Object.keys(this._gamepads).length > 0;
  }

  _attachEventListeners() {
    window.addEventListener('gamepadconnected', e => this._connectionListener(e));
    window.addEventListener('gamepaddisconnected', e => this._disconnectionListener(e));
  }

  _connectionListener(e) {
    // Ignore controllers that are not standard controllers
    if ( e.gamepad.mapping != "standard" ) {
      this._unannouncedGamepads.push(e.gamepad.index);
      return console.log(`🎮 Ignoring gamepad ${e.gamepad.id} because it is not a 'standard mapping' gamepad`);
    }

    new Notification(`🎮 Connected to gamepad "${e.gamepad.id}"`);
    this._saveState(e.gamepad);
    if ( !this._running ) {
      this._running = true;
      requestAnimationFrame(() => this._pollGamepads());
    }
  }

  _disconnectionListener(e) {
    // Remove unannounced gamepads from our list if they leave
    if ( this._unannouncedGamepads.includes(e.gamepad.index) )
      this._unannouncedGamepads = this._unannouncedGamepads.filter(g => g != e.gamepad.index);

    // Ignore controllers that are not in our main list
    if ( !this._gamepads[e.gamepad.index] )
      return;

    new Notification(`🎮 Gamepad "${e.gamepad.id}" disconnected`);
    delete this._gamepads[e.gamepad.index];
    if ( Object.keys(this._gamepads).length == 0 ) this._running = false;
  }

  _pollGamepads() {
    if ( !this._running ) return;

    const currentGamepads = navigator.getGamepads();
    if ( !currentGamepads ) return;

    for ( const gamepad of currentGamepads ) {
      // Don't use non-existant gamepads (looking at you, Chrome)
      if ( !gamepad ) continue;

      // Only use gamepads that we got a valid connect event for
      if ( !this._gamepads[gamepad.index] ) {
        if ( !this._unannouncedGamepads.includes(gamepad.index) ) {
          console.warn("Got an unannounced gamepad:", gamepad);
          this._unannouncedGamepads.push(gamepad.index);
        }
        continue;
      }

      // If any of the (useful) buttons change state on any of the gamepads,
      // let Silicon8 know.

      for ( const key in gamepad.buttons ) {
        if ( gamepad.buttons[key].pressed && this._waiting )
          this._waiting([gamepad.index, key]);
        if ( gamepad.index in this._keymap && gamepad.buttons[key].pressed != this._gamepads[gamepad.index][key] ) {
          const chip8Key = parseInt(this._keymap[gamepad.index][key]);
          if (isNaN(chip8Key)) continue;
          if ( gamepad.buttons[key].pressed )
            this._instance.pressKey(chip8Key);
          else
            this._instance.releaseKey(chip8Key);
        }
      }

      // Save new state for next loop
      this._saveState(gamepad);
    }

    // Keep polling
    requestAnimationFrame(() => this._pollGamepads());
  }

  _saveState(gamepad) {
    this._gamepads[gamepad.index] =
      Object.keys(gamepad.buttons)
            .map(key => [key, gamepad.buttons[key].pressed])
            .reduce((acc, value) => {
              acc[value[0]] = value[1];
              return acc;
            }, {});
  }

}
