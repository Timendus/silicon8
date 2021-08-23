let cyclesPerFrame = 30;

module.exports = instance => {
  const keys = {
    // Arrow keys
    38: 5, 		// up
    37: 7, 		// left
    39: 9, 		// right
    40: 8, 		// down

    // 16 key pad
    49: 1,		// 1
    50: 2,		// 2
    51: 3,		// 3
    52: 0xC,	// 4
    81: 4, 		// Q
    87: 5, 		// W
    69: 6, 		// E
    82: 0xD, 	// R
    65: 7, 		// A
    83: 8, 		// S
    68: 9, 		// D
    70: 0xE, 	// F
    90: 0xA, 	// Z
    88: 0, 		// X
    67: 0xB, 	// C
    86: 0xF, 	// V

    // Other number keys
    48: 0,
    53: 5,
    54: 6,
    55: 7,
    56: 8,
    57: 9,
  };

  window.addEventListener('keydown', e => {
    if ( !instance ) return;
    switch(e.keyCode) {
      case 13:  // Enter
        return instance.dumpStatus();
      case 187: // +
        cyclesPerFrame *= 2;
        return instance.setCyclesPerFrame(cyclesPerFrame);
      case 189: // -
        cyclesPerFrame /= 2;
        return instance.setCyclesPerFrame(cyclesPerFrame);
      default:
        if ( keys[e.keyCode] )
          instance.pressKey(keys[e.keyCode]);
    }
  });

  window.addEventListener('keyup', e => {
    if ( instance && keys[e.keyCode] )
      instance.releaseKey(keys[e.keyCode]);
  });

  document.querySelectorAll('.keyboard button').forEach(button => {
    button.addEventListener('touchstart', () => {
      instance.pressKey(button.dataset.value);
    }, { passive: true });
    button.addEventListener('touchend', () => {
      instance.releaseKey(button.dataset.value);
    }, { passive: true });
  });
};
