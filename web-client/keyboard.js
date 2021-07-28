module.exports = cpu => {
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
    52: 'C',	// 4
    81: 4, 		// Q
    87: 5, 		// W
    69: 6, 		// E
    82: 'D', 	// R
    65: 7, 		// A
    83: 8, 		// S
    68: 9, 		// D
    70: 'E', 	// F
    90: 'A', 	// Z
    88: 0, 		// X
    67: 'B', 	// C
    86: 'F', 	// V

    // Other number keys
    48: 0,
    53: 5,
    54: 6,
    55: 7,
    56: 8,
    57: 9,
  };

  window.addEventListener('keydown', e => {
    if ( cpu )
      cpu.pressKey(keys[e.keyCode]);
  });

  window.addEventListener('keyup', e => {
    if ( cpu )
      cpu.releaseKey(keys[e.keyCode]);
  });

};
