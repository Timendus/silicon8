_This is still very much a work in progress. So far it's just a place to
document some ideas, thoughts and findings._

# XO-CHIP `palette` proposal

This is a proposal to extend XO-CHIP with a single instruction that gives programs the ability to change the color palette at runtime. Shown below are only the parts with proposed changes to the [XO-CHIP spec](https://github.com/JohnEarnest/Octo/blob/gh-pages/docs/XO-ChipSpecification.md).

## XO-CHIP spec changes

The XO-Chip instructions are summarized as follows:

- `save vx - vy` (`0x5XY2`) save an inclusive range of registers to memory starting at `i`.
- `load vx - vy` (`0x5XY3`) load an inclusive range of registers from memory starting at `i`.
- `saveflags vx` (`0xFN75`) save v0-vn to flag registers. (generalizing SCHIP).
- `loadflags vx` (`0xFN85`) restore v0-vn from flag registers. (generalizing SCHIP).
- `i := long NNNN` (`0xF000, 0xNNNN`) load `i` with a 16-bit address.
- `plane n` (`0xFN01`) select zero or more drawing planes by bitmask (0 <= n <= 3).
- `palette x y` (`0x5XY4`) load palette data for planes x to y from memory starting at `i`
- `audio` (`0xF002`) store 16 bytes starting at `i` in the audio pattern buffer.
- `pitch := vx` (`0xFX3A`) set the audio pattern playback rate to `4000*2^((vx-64)/48)`Hz.
- `scroll-up n` (`0x00DN`) scroll the contents of the display up by 0-15 pixels.


Graphics
--------
Chip8 has a unique XOR-drawing approach to graphics which provides interesting challenges and solutions. However, with only 2 colors available there are many interesting kinds of games which cannot feasibly be rendered - for example, puzzle games where color matching is a key mechanic such as _Puyo-Puyo_ or _Dr. Mario_. It would be nice to augment Chip8 with the ability to draw a few additional colors without losing the unique flavor of its graphics drawing mode.

XO-Chip expands the display with a second drawing bitplane. The first bitplane functions exactly as normal in Chip8 or SuperChip8 mode. The second bitplane is superimposed on the first and draws in a different color. Where set pixels on both bitplanes overlap they are drawn using another color. This approach is thus capable of drawing images containing up to 4 colors: The background color, the first drawing plane's color, the second drawing plane's color and the color used when both planes overlap.

The `plane` instruction takes a 2-bit bitmask which selects one, both or neither of the drawing planes, with the least significant bit being the first drawing plane. Thus, `plane 1` selects only the first drawing plane, `plane 2` selects only the second and `plane 3` selects both. By default, only the first drawing plane is selected for compatibility with normal Chip8 operation. `clear`, `sprite` and the various `scroll-` instructions apply only to the selected drawing plane(s). It is thus possible to scroll one plane as a "background" while a "foreground" remains fixed.

When a `sprite` is drawn with both planes selected the operation will consume twice as many bytes of graphics data as it normally would, first drawing the specified sprite height to the first plane and then drawing the same number of bytes to the second plane. If the sprite was 4 pixels high, the first plane would be drawn to using bytes at the addresses `i` to `i`+3 and the second plane would be drawn using bytes at the addresses `i`+4 to `i`+7. This means that drawing sprites with both planes selected will naturally and conveniently draw or erase 4-color sprites. With both planes selected the `vf` collision flag will be set after a sprite drawing operation if pixels from _either_ plane are toggled from on to off.

When a program starts, the colors that appear on the display for the planes are the default colors of the interpreter. Or the interpreter can have the user set the colors manually. But a program can override these colors programmatically by using the `palette` instruction. `palette` takes two plane bitmasks as parameters, that together form a range. Thus, `palette 0 1` changes only the background color and the color of the first plane. `palette 0 3` changes all four colors. `palette 1 2` only changes the colors for when a single plane has set pixels, et cetera. Color values are loaded from memory at the address that `i` points to.

For example, to have a monochrome game (using only the first plane) set the colors to red pixels on a blue background:

      i := colors
      palette 0 1   # Load palette for background and first plane

      ...

    : colors
      0x03   # Blue
      0xE0   # Red

Colors are stored as single bytes in the RGB332 format. This means that the most significant three bits represent the red channel, the next three bits the green channel and the two least significant bits the blue channel. Interpreters are free to choose a method of mapping RGB332 colors to the display. But the intervals in the example conversion function below were found to provide nice results.

```javascript
function rgb332to888(c) {
    const map3bits = [0, 0x20, 0x40, 0x60, 0x80, 0xA0, 0xC0, 0xff];
    const map2bits = [0, 0x60, 0xA0, 0xff];
    return map3bits[c >> 5 & 7] << 16 |   // Red
           map3bits[c >> 2 & 7] << 8 |    // Green
           map2bits[c & 3];               // Blue
}
```

This allows programs to select colors from a total palette of these 256 different colors (gray values marked).

![The 256 colors that `palette` can choose from](./xo-chip-palette-proposal.png)


Encoding is chosen such that it would be possible to provide 4 bitplanes (and thus 16 colors on the display at once!) in the future should it prove necessary. The `plane` instruction is placed in unpopulated space in the `0xF`-prefix instructions. The `palette` instruction joins the ranged `save` and `load` instructions in the `0x5XY_` space.

Changelog
---------
- 1.0 : initial release.
- 1.1 : added the `pitch := vx` instruction, generalized `loadflags`/`saveflags` to a full nybble range.
- 1.2 : added the `palette` instruction
