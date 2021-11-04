const notify = require('./notification');

module.exports = instance => {

  let gamepads = [];
  let running = false;

  // Default buttons for a standard controller
  const keys = {
    12: 5, // Up
    14: 7, // Left
    15: 9, // Right
    13: 8, // Down

    0: 6,  // A
    1: 4   // B
  };

  window.addEventListener('gamepadconnected', e => {
    // Ignore controllers that are not standard controllers
    if ( e.gamepad.mapping != "standard" )
      return console.log("🎮 Ignoring:", e.gamepad);

    console.log("🎮 Connected:", e.gamepad);
    notify(`🎮 Connected to gamepad "${e.gamepad.id}"`);
    gamepads.push(e.gamepad.index);
    if ( !running ) {
      running = true;
      requestAnimationFrame(pollGamepads);
    }
  });

  window.addEventListener('gamepaddisconnected', e => {
    // Ignore controllers that are not in our list
    if ( !gamepads.includes(e.gamepad.index) )
      return console.log("🎮 Ignoring:", e.gamepad);

    console.log("🎮 Disconnected:", e.gamepad);
    notify(`🎮 Disconnected from gamepad "${e.gamepad.id}"`);
    gamepads = gamepads.filter(g => g != e.gamepad.index);
    if ( gamepads.length == 0 ) running = false;
  });

  function pollGamepads() {
    if ( !running ) return;

    const currentGamepads = navigator.getGamepads();
    if ( !currentGamepads ) return;

    for ( const gamepad of currentGamepads ) {
      // Don't use non-existant gamepads
      if ( !gamepad ) continue;

      // Only use gamepads that we got a valid connect event for
      if ( !gamepads.includes(gamepad.index) ) continue;

      // If any of the right buttons are pressed or released on any of the
      // gamepads, let Silicon8 know. This is not really compatible with having
      // multiple gamepads connected, but I suppose that's not a big issue.
      for ( const key in keys ) {
        if ( gamepad.buttons[key].pressed )
          instance.pressKey(keys[key]);
        else
          instance.releaseKey(keys[key]);
      }
    }

    // Keep polling
    requestAnimationFrame(pollGamepads);
  }

};
