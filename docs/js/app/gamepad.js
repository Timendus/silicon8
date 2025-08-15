import notify from "./notification.js";

export default instance => {

  const gamepads = {};
  let unannouncedGamepads = [];
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
    if ( e.gamepad.mapping != "standard" ) {
      unannouncedGamepads.push(e.gamepad.index);
      return console.log(`🎮 Ignoring gamepad ${e.gamepad.id} because it is not a 'standard mapping' gamepad`);
    }

    notify(`🎮 Connected to gamepad "${e.gamepad.id}"`);
    saveState(e.gamepad);
    if ( !running ) {
      running = true;
      requestAnimationFrame(pollGamepads);
    }
  });

  window.addEventListener('gamepaddisconnected', e => {
    // Remove unannounced gamepads from our list if they leave
    if ( unannouncedGamepads.includes(e.gamepad.index) )
      unannouncedGamepads = unannouncedGamepads.filter(g => g != e.gamepad.index);
    // Ignore controllers that are not in our main list
    if ( !gamepads[e.gamepad.index] )
      return;

    notify(`🎮 Gamepad "${e.gamepad.id}" disconnected`);
    delete gamepads[e.gamepad.index];
    if ( Object.keys(gamepads).length == 0 ) running = false;
  });

  function pollGamepads() {
    if ( !running ) return;

    const currentGamepads = navigator.getGamepads();
    if ( !currentGamepads ) return;

    for ( const gamepad of currentGamepads ) {
      // Don't use non-existant gamepads (looking at you, Chrome)
      if ( !gamepad ) continue;

      // Only use gamepads that we got a valid connect event for
      if ( !gamepads[gamepad.index] ) {
        if ( !unannouncedGamepads.includes(gamepad.index) ) {
          console.warn("Got an unannounced gamepad:", gamepad);
          unannouncedGamepads.push(gamepad.index);
        }
        continue;
      }

      // If any of the (useful) buttons change state on any of the gamepads,
      // let Silicon8 know.
      for ( const key in keys ) {
        if ( gamepad.buttons[key].pressed != gamepads[gamepad.index][key] ) {
          if ( gamepad.buttons[key].pressed )
            instance.pressKey(keys[key]);
          else
            instance.releaseKey(keys[key]);
        }
      }

      // Save new state for next loop
      saveState(gamepad);
    }

    // Keep polling
    requestAnimationFrame(pollGamepads);
  }

  function saveState(gamepad) {
    gamepads[gamepad.index] =
      Object.keys(keys)
            .map(key => [key, gamepad.buttons[key].pressed])
            .reduce((acc, value) => (acc[value[0]] = value[1], acc), {});
  }

};
