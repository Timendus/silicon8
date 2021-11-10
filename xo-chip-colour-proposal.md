_This is still very much a work in progress. So far it's just a place to
document some ideas, thoughts and findings._

# XO-CHIP colour proposal

![Showing 16 colours in Silicon8](colours.png)

[John Earnest](https://github.com/JohnEarnest) mentions in [his proposal
for XO-CHIP](https://github.com/JohnEarnest/Octo/blob/gh-pages/docs/XO-ChipSpecification.md)
that a theoretical sixteen colours are possible with the `plane` opcode:

> Encoding is chosen such that it would be possible to provide 4 bitplanes (and
> thus 16 colors!) in the future should it prove necessary.

However, Octo doesn't implement this theoretical 16-colour feature, and it seems
to have been left as an exercise to the reader. This document proposes a
concrete specification for the possible colours in XO-CHIP's two additional
planes.

## Constraints

### Memory

Octo has chosen to make the four colours that it does have configurable.
Considering the program size contraints of 3.5K / 32K this makes sense; adding
the other two bits of colour doubles the size of all image data in your program.
But still, programmatically having more colours opens up possibilities that four
configurable colours just don't provide, like showing a colourful Mandelbrot
set, using colour to indicate different players or enemies, et cetera.

Also, it would be possible to still use two planes, but two _different_ planes
for some sprites, effectively giving those sprites access to a different colour
palette without sacrificing storage space. This means that the colour palette
that we choose should preferably be "useful" when using one, two, three or four
bits of colour, in any `plane` permutation.

Things I consider "useful" would for example be:
  * Being able to switch palettes to re-use the same sprite for different
    purposes (the red player and the blue player, the green goblin and the brown
    goblin)
  * Having more vivid colours in another plane than more dull colours. Combined
    with screen scolling, this allows for a brighter "foreground" and a more
    subdued "background" that can scroll independently
  * The same goes for having a game world with a palette in "earthy" colours
    with more vivid sprites for entities (players, enemies, pickups)

### Colour compatibility

I thought it valuable for developers implementing this proposal to keep the
least significant plane compatible with standard CHIP-8, which means that in
`plane 1`, `0` indicates a non-active pixel (dark) and `1` an active pixel
(light).

Compatibility with Octo's implementation of XO-CHIP is kind of impossible,
because due to its configurability different values in `plane 3` can correspond
to any colour. However, we can take a look at the default colours Octo uses:

| Bits   | Colour                                                                  |
|--------|-------------------------------------------------------------------------|
| `0b00` | ![#996600](https://via.placeholder.com/15/996600/000000?text=+) #996600 |
| `0b01` | ![#FFCC00](https://via.placeholder.com/15/FFCC00/000000?text=+) #FFCC00 |
| `0b10` | ![#FF6600](https://via.placeholder.com/15/FF6600/000000?text=+) #FF6600 |
| `0b11` | ![#662200](https://via.placeholder.com/15/662200/000000?text=+) #662200 |

As you can see these are fairly warm colours on a spectrum from lighter to
darker. Essentially giving the user four levels of "grayscale", but in a much
less boring palette. There is one issue with this palette though, and that is
that `0b11` is a darker colour than `0b00`, even though we just concluded that
for the CHIP-8 "palette" `0b0` needs to be a non-active pixel. So this colour
would have to be darker than a non-active pixel..? 😄

So trying to get Octo-compatibility out of the box, even in the more liberal
sense of using four shades of gray to represent the Octo palette, doesn't really
seem to work very well. Combined with Octo's configurability it would seem like
a waste of time to worry about this too much. Interpreter developers wanting to
support a version of XO-Chip that's really compatible with Octo will have to
make the two-bit palette configurable anyway.

## Candidate palettes

There have been plenty of 16-colour palettes on old machines. So let's take a
look at what those who came before us have chosen to do.

(I guess I should have done this before I came up with my own Silicon8 v1.0
palette. Oh well 😉)

### Microsoft Windows and IBM OS/2 default 16-color palette

Microsoft seems to have had a very mathematical approach to dividing up the
colour space. Every combination of the extremes (`0x00` and `0xFF`) is
represented, with the in-between colours using `0x80` (128), which is pretty
much exactly in the middle. It lays the colours out in such a way that `bit 3`
becomes a "brightness toggle", which is nice I guess.

|  # | Binary # | HEX colour | Colour                                                                 |
|----|----------|-----------|-------------------------------------------------------------------------|
|  0 | `0b0000` | `#000000` | ![#000000](https://via.placeholder.com/15/000000/000000?text=+) Black   |
|  1 | `0b0001` | `#800000` | ![#800000](https://via.placeholder.com/15/880000/000000?text=+) Maroon  |
|  2 | `0b0010` | `#008000` | ![#008000](https://via.placeholder.com/15/008800/000000?text=+) Green   |
|  3 | `0b0011` | `#808000` | ![#808000](https://via.placeholder.com/15/888800/000000?text=+) Olive   |
|  4 | `0b0100` | `#000080` | ![#000080](https://via.placeholder.com/15/000088/000000?text=+) Navy    |
|  5 | `0b0101` | `#800080` | ![#800080](https://via.placeholder.com/15/880088/000000?text=+) Purple  |
|  6 | `0b0110` | `#008080` | ![#008080](https://via.placeholder.com/15/008888/000000?text=+) Teal    |
|  7 | `0b0111` | `#C0C0C0` | ![#C0C0C0](https://via.placeholder.com/15/C0C0C0/000000?text=+) Silver  |
|  8 | `0b1000` | `#808080` | ![#808080](https://via.placeholder.com/15/808080/000000?text=+) Gray    |
|  9 | `0b1001` | `#FF0000` | ![#FF0000](https://via.placeholder.com/15/FF0000/000000?text=+) Red     |
| 10 | `0b1010` | `#00FF00` | ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) Lime    |
| 11 | `0b1011` | `#FFFF00` | ![#FFFF00](https://via.placeholder.com/15/FFFF00/000000?text=+) Yellow  |
| 12 | `0b1100` | `#0000FF` | ![#0000FF](https://via.placeholder.com/15/0000FF/000000?text=+) Blue    |
| 13 | `0b1101` | `#FF00FF` | ![#FF00FF](https://via.placeholder.com/15/FF00FF/000000?text=+) Fuchsia |
| 14 | `0b1110` | `#00FFFF` | ![#00FFFF](https://via.placeholder.com/15/00FFFF/000000?text=+) Aqua    |
| 15 | `0b1111` | `#FFFFFF` | ![#FFFFFF](https://via.placeholder.com/15/FFFFFF/000000?text=+) White   |

### Apple Macintosh default 16-color palette

Of course, Apple being Apple, this palette is much more pleasing on the eyes.
The colours are laid out in an order that feels like it makes sense, a bit like
a rainbow. And they aren't quite so extreme, so the colours seem to "scream" at
you a lot less.

|  # | Binary # | HEX colour | Colour                                                                     |
|----|----------|-----------|-----------------------------------------------------------------------------|
|  0 | `0b0000` | `#FFFFFF` | ![#FFFFFF](https://via.placeholder.com/15/FFFFFF/000000?text=+) White       |
|  1 | `0b0001` | `#fbf305` | ![#fbf305](https://via.placeholder.com/15/fbf305/000000?text=+) Yellow      |
|  2 | `0b0010` | `#ff6403` | ![#ff6403](https://via.placeholder.com/15/ff6403/000000?text=+) Orange      |
|  3 | `0b0011` | `#dd0907` | ![#dd0907](https://via.placeholder.com/15/dd0907/000000?text=+) Red         |
|  4 | `0b0100` | `#f20884` | ![#f20884](https://via.placeholder.com/15/f20884/000000?text=+) Magenta     |
|  5 | `0b0101` | `#4700a5` | ![#4700a5](https://via.placeholder.com/15/4700a5/000000?text=+) Purple      |
|  6 | `0b0110` | `#0000d3` | ![#0000d3](https://via.placeholder.com/15/0000d3/000000?text=+) Blue        |
|  7 | `0b0111` | `#02abea` | ![#02abea](https://via.placeholder.com/15/02abea/000000?text=+) Cyan        |
|  8 | `0b1000` | `#1fb714` | ![#1fb714](https://via.placeholder.com/15/1fb714/000000?text=+) Green       |
|  9 | `0b1001` | `#006412` | ![#006412](https://via.placeholder.com/15/006412/000000?text=+) Dark Green  |
| 10 | `0b1010` | `#562c05` | ![#562c05](https://via.placeholder.com/15/562c05/000000?text=+) Brown       |
| 11 | `0b1011` | `#90713a` | ![#90713a](https://via.placeholder.com/15/90713a/000000?text=+) Tan         |
| 12 | `0b1100` | `#C0C0C0` | ![#C0C0C0](https://via.placeholder.com/15/C0C0C0/000000?text=+) Light gray  |
| 13 | `0b1101` | `#808080` | ![#808080](https://via.placeholder.com/15/808080/000000?text=+) Medium gray |
| 14 | `0b1110` | `#404040` | ![#404040](https://via.placeholder.com/15/404040/000000?text=+) Dark gray   |
| 15 | `0b1111` | `#000000` | ![#000000](https://via.placeholder.com/15/000000/000000?text=+) Black       |

### RISC OS default palette

The designers of this palette clearly thought that having lots of different
levels of gray was important. Which is very nice for some purposes, like good
looking fonts, but probably not so great for others, like flashy games.

|  # | Binary # | HEX colour | Colour                                                                     |
|----|----------|-----------|-----------------------------------------------------------------------------|
|  0 | `0b0000` | `#FFFFFF` | ![#FFFFFF](https://via.placeholder.com/15/FFFFFF/000000?text=+) White       |
|  1 | `0b0001` | `#dddddd` | ![#dddddd](https://via.placeholder.com/15/dddddd/000000?text=+) Gray #1     |
|  2 | `0b0010` | `#bbbbbb` | ![#bbbbbb](https://via.placeholder.com/15/bbbbbb/000000?text=+) Gray #2     |
|  3 | `0b0011` | `#999999` | ![#999999](https://via.placeholder.com/15/999999/000000?text=+) Gray #3     |
|  4 | `0b0100` | `#777777` | ![#777777](https://via.placeholder.com/15/777777/000000?text=+) Gray #4     |
|  5 | `0b0101` | `#555555` | ![#555555](https://via.placeholder.com/15/555555/000000?text=+) Gray #5     |
|  6 | `0b0110` | `#333333` | ![#333333](https://via.placeholder.com/15/333333/000000?text=+) Gray #6     |
|  7 | `0b0111` | `#000000` | ![#000000](https://via.placeholder.com/15/000000/000000?text=+) Black       |
|  8 | `0b1000` | `#004499` | ![#004499](https://via.placeholder.com/15/004499/000000?text=+) Dark blue   |
|  9 | `0b1001` | `#eeee00` | ![#eeee00](https://via.placeholder.com/15/eeee00/000000?text=+) Yellow      |
| 10 | `0b1010` | `#00cc00` | ![#00cc00](https://via.placeholder.com/15/00cc00/000000?text=+) Green       |
| 11 | `0b1011` | `#dd0000` | ![#dd0000](https://via.placeholder.com/15/dd0000/000000?text=+) Red         |
| 12 | `0b1100` | `#eeeebb` | ![#eeeebb](https://via.placeholder.com/15/eeeebb/000000?text=+) Beige       |
| 13 | `0b1101` | `#558800` | ![#558800](https://via.placeholder.com/15/558800/000000?text=+) Dark green  |
| 14 | `0b1110` | `#ffbb00` | ![#ffbb00](https://via.placeholder.com/15/ffbb00/000000?text=+) Gold/Orange |
| 15 | `0b1111` | `#00bbff` | ![#00bbff](https://via.placeholder.com/15/00bbff/000000?text=+) Light blue  |

### CGA 16-color palette

The CGA palette looks a lot like the Microsoft one, except that it uses a
different in-between value of `0xAA` and reorders the colours a bit. Again, bit
3 is a "brightness toggle".

|  # | Binary # | HEX colour | Colour                                                                       |
|----|----------|-----------|-------------------------------------------------------------------------------|
|  0 | `0b0000` | `#000000` | ![#000000](https://via.placeholder.com/15/000000/000000?text=+) Black         |
|  1 | `0b0001` | `#0000aa` | ![#0000aa](https://via.placeholder.com/15/0000aa/000000?text=+) Blue          |
|  2 | `0b0010` | `#00aa00` | ![#00aa00](https://via.placeholder.com/15/00aa00/000000?text=+) Green         |
|  3 | `0b0011` | `#00aaaa` | ![#00aaaa](https://via.placeholder.com/15/00aaaa/000000?text=+) Cyan          |
|  4 | `0b0100` | `#aa0000` | ![#aa0000](https://via.placeholder.com/15/aa0000/000000?text=+) Red           |
|  5 | `0b0101` | `#aa00aa` | ![#aa00aa](https://via.placeholder.com/15/aa00aa/000000?text=+) Magenta       |
|  6 | `0b0110` | `#aa5500` | ![#aa5500](https://via.placeholder.com/15/aa5500/000000?text=+) Brown         |
|  7 | `0b0111` | `#aaaaaa` | ![#aaaaaa](https://via.placeholder.com/15/aaaaaa/000000?text=+) Light gray    |
|  8 | `0b1000` | `#555555` | ![#555555](https://via.placeholder.com/15/555555/000000?text=+) Dark gray     |
|  9 | `0b1001` | `#5555ff` | ![#5555ff](https://via.placeholder.com/15/5555ff/000000?text=+) Light blue    |
| 10 | `0b1010` | `#55ff55` | ![#55ff55](https://via.placeholder.com/15/55ff55/000000?text=+) Light green   |
| 11 | `0b1011` | `#55ffff` | ![#55ffff](https://via.placeholder.com/15/55ffff/000000?text=+) Light cyan    |
| 12 | `0b1100` | `#ff5555` | ![#ff5555](https://via.placeholder.com/15/ff5555/000000?text=+) Light red     |
| 13 | `0b1101` | `#ff55ff` | ![#ff55ff](https://via.placeholder.com/15/ff55ff/000000?text=+) Light magenta |
| 14 | `0b1110` | `#ffff55` | ![#ffff55](https://via.placeholder.com/15/ffff55/000000?text=+) Yellow        |
| 15 | `0b1111` | `#ffffff` | ![#ffffff](https://via.placeholder.com/15/ffffff/000000?text=+) White         |

### Pico-8 16-colour palette

If I understand correctly the 16 colours in Pico-8 can be mapped to other
colours, but these are the 16 system colors the screen palette is mapped to when
PICO-8 starts up.

I like how this palette is much more stylized, like the Apple one, but still
manages to look very 8-bit-like when used.

|  # | Binary # | HEX colour | Colour                                                                     |
|----|----------|-----------|-----------------------------------------------------------------------------|
| 0  | `0b0000` | `#000000` | ![#000000](https://via.placeholder.com/15/000000/000000?text=+) black       |
| 1  | `0b0001` | `#1D2B53` | ![#1D2B53](https://via.placeholder.com/15/1D2B53/000000?text=+) dark-blue   |
| 2  | `0b0010` | `#7E2553` | ![#7E2553](https://via.placeholder.com/15/7E2553/000000?text=+) dark-purple |
| 3  | `0b0011` | `#008751` | ![#008751](https://via.placeholder.com/15/008751/000000?text=+) dark-green  |
| 4  | `0b0100` | `#AB5236` | ![#AB5236](https://via.placeholder.com/15/AB5236/000000?text=+) brown       |
| 5  | `0b0101` | `#5F574F` | ![#5F574F](https://via.placeholder.com/15/5F574F/000000?text=+) dark-grey   |
| 6  | `0b0110` | `#C2C3C7` | ![#C2C3C7](https://via.placeholder.com/15/C2C3C7/000000?text=+) light-grey  |
| 7  | `0b0111` | `#FFF1E8` | ![#FFF1E8](https://via.placeholder.com/15/FFF1E8/000000?text=+) white       |
| 8  | `0b1000` | `#FF004D` | ![#FF004D](https://via.placeholder.com/15/FF004D/000000?text=+) red         |
| 9  | `0b1001` | `#FFA300` | ![#FFA300](https://via.placeholder.com/15/FFA300/000000?text=+) orange      |
| 10 | `0b1010` | `#FFEC27` | ![#FFEC27](https://via.placeholder.com/15/FFEC27/000000?text=+) yellow      |
| 11 | `0b1011` | `#00E436` | ![#00E436](https://via.placeholder.com/15/00E436/000000?text=+) green       |
| 12 | `0b1100` | `#29ADFF` | ![#29ADFF](https://via.placeholder.com/15/29ADFF/000000?text=+) blue        |
| 13 | `0b1101` | `#83769C` | ![#83769C](https://via.placeholder.com/15/83769C/000000?text=+) lavender    |
| 14 | `0b1110` | `#FF77A8` | ![#FF77A8](https://via.placeholder.com/15/FF77A8/000000?text=+) pink        |
| 15 | `0b1111` | `#FFCCAA` | ![#FFCCAA](https://via.placeholder.com/15/FFCCAA/000000?text=+) light-peach |

## Silicon8 palette

### v1.0

The current palette that Silicon8 uses is the following:

|  # | Binary # | HEX colour | Colour                                                                    |
|----|----------|-----------|----------------------------------------------------------------------------|
|  0 | `0b0000` | `#000000` | ![#000000](https://via.placeholder.com/15/000000/000000?text=+) Black      |
|  1 | `0b0001` | `#FFFFFF` | ![#FFFFFF](https://via.placeholder.com/15/FFFFFF/000000?text=+) White      |
|  2 | `0b0010` | `#AAAAAA` | ![#AAAAAA](https://via.placeholder.com/15/AAAAAA/000000?text=+) Light gray |
|  3 | `0b0011` | `#555555` | ![#555555](https://via.placeholder.com/15/555555/000000?text=+) Dark gray  |
|  4 | `0b0100` | `#FF0000` | ![#FF0000](https://via.placeholder.com/15/FF0000/000000?text=+) Red        |
|  5 | `0b0101` | `#00FF00` | ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) Green      |
|  6 | `0b0110` | `#0000FF` | ![#0000FF](https://via.placeholder.com/15/0000FF/000000?text=+) Blue       |
|  7 | `0b0111` | `#FFFF00` | ![#FFFF00](https://via.placeholder.com/15/FFFF00/000000?text=+) Yellow     |
|  8 | `0b1000` | `#880000` | ![#880000](https://via.placeholder.com/15/880000/000000?text=+) Bordeaux   |
|  9 | `0b1001` | `#008800` | ![#008800](https://via.placeholder.com/15/008800/000000?text=+) Olive      |
| 10 | `0b1010` | `#000088` | ![#000088](https://via.placeholder.com/15/000088/000000?text=+) Navy       |
| 11 | `0b1011` | `#888800` | ![#888800](https://via.placeholder.com/15/888800/000000?text=+) Orange     |
| 12 | `0b1100` | `#FF00FF` | ![#FF00FF](https://via.placeholder.com/15/FF00FF/000000?text=+) Pink       |
| 13 | `0b1101` | `#00FFFF` | ![#00FFFF](https://via.placeholder.com/15/00FFFF/000000?text=+) Cyan       |
| 14 | `0b1110` | `#880088` | ![#880088](https://via.placeholder.com/15/880088/000000?text=+) Purple     |
| 15 | `0b1111` | `#008888` | ![#008888](https://via.placeholder.com/15/008888/000000?text=+) Ocean      |

This palette looks a lot like the Microsoft and CGA ones, except that my
in-between value is `0x88` (which may or may not be a good idea) and that I
chose a different order for the colours.

Advantages of this palette:
  * The grays are in the first four spots, so that XO-Chip programs get
    four levels of grayscale by default, without any additional effort on the
    part of the developer of the interpreter (albeit in the "wrong" order)
  * The primary colours red, green, blue and yellow can be used by adding just
    one extra plane to an image
  * In use, it very much reminds me of the screamy bright "good old days" of CGA

Disadvantages of this palette:
  * Bit 3 doesn't function like a "brightness toggle" like the MS and CGA
    palettes do (is that a big disadvantage? I don't know)
  * The colours aren't as pretty as the Apple or Pico-8 ones
  * Individual planes don't represent very useful colours (white, light gray,
    red, bordeax)

Let's break this palette up in it's "sub-palettes".

#### Individual planes

|  # | Binary # | HEX colour | Colour                                                                    |
|----|----------|-----------|----------------------------------------------------------------------------|
|  0 | `0b0000` | `#000000` | ![#000000](https://via.placeholder.com/15/000000/000000?text=+) Black      |
|  1 | `0b0001` | `#FFFFFF` | ![#FFFFFF](https://via.placeholder.com/15/FFFFFF/000000?text=+) White      |
|  2 | `0b0010` | `#AAAAAA` | ![#AAAAAA](https://via.placeholder.com/15/AAAAAA/000000?text=+) Light gray |
|  4 | `0b0100` | `#FF0000` | ![#FF0000](https://via.placeholder.com/15/FF0000/000000?text=+) Red        |
|  8 | `0b1000` | `#880000` | ![#880000](https://via.placeholder.com/15/880000/000000?text=+) Bordeaux   |

#### Planes 0 and 1

|  # | Binary # | HEX colour | Colour                                                                    |
|----|----------|-----------|----------------------------------------------------------------------------|
|  0 | `0b0000` | `#000000` | ![#000000](https://via.placeholder.com/15/000000/000000?text=+) Black      |
|  1 | `0b0001` | `#FFFFFF` | ![#FFFFFF](https://via.placeholder.com/15/FFFFFF/000000?text=+) White      |
|  2 | `0b0010` | `#AAAAAA` | ![#AAAAAA](https://via.placeholder.com/15/AAAAAA/000000?text=+) Light gray |
|  3 | `0b0011` | `#555555` | ![#555555](https://via.placeholder.com/15/555555/000000?text=+) Dark gray  |

#### Planes 0 and 2

|  # | Binary # | HEX colour | Colour                                                                    |
|----|----------|-----------|----------------------------------------------------------------------------|
|  0 | `0b0000` | `#000000` | ![#000000](https://via.placeholder.com/15/000000/000000?text=+) Black      |
|  1 | `0b0001` | `#FFFFFF` | ![#FFFFFF](https://via.placeholder.com/15/FFFFFF/000000?text=+) White      |
|  4 | `0b0100` | `#FF0000` | ![#FF0000](https://via.placeholder.com/15/FF0000/000000?text=+) Red        |
|  5 | `0b0101` | `#00FF00` | ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) Green      |

#### Planes 0 and 3

|  # | Binary # | HEX colour | Colour                                                                    |
|----|----------|-----------|----------------------------------------------------------------------------|
|  0 | `0b0000` | `#000000` | ![#000000](https://via.placeholder.com/15/000000/000000?text=+) Black      |
|  1 | `0b0001` | `#FFFFFF` | ![#FFFFFF](https://via.placeholder.com/15/FFFFFF/000000?text=+) White      |
|  8 | `0b1000` | `#880000` | ![#880000](https://via.placeholder.com/15/880000/000000?text=+) Bordeaux   |
|  9 | `0b1001` | `#008800` | ![#008800](https://via.placeholder.com/15/008800/000000?text=+) Olive      |

#### Planes 1 and 2

|  # | Binary # | HEX colour | Colour                                                                    |
|----|----------|-----------|----------------------------------------------------------------------------|
|  0 | `0b0000` | `#000000` | ![#000000](https://via.placeholder.com/15/000000/000000?text=+) Black      |
|  2 | `0b0010` | `#AAAAAA` | ![#AAAAAA](https://via.placeholder.com/15/AAAAAA/000000?text=+) Light gray |
|  4 | `0b0100` | `#FF0000` | ![#FF0000](https://via.placeholder.com/15/FF0000/000000?text=+) Red        |
|  6 | `0b0110` | `#0000FF` | ![#0000FF](https://via.placeholder.com/15/0000FF/000000?text=+) Blue       |

#### Planes 1 and 3

|  # | Binary # | HEX colour | Colour                                                                    |
|----|----------|-----------|----------------------------------------------------------------------------|
|  0 | `0b0000` | `#000000` | ![#000000](https://via.placeholder.com/15/000000/000000?text=+) Black      |
|  2 | `0b0010` | `#AAAAAA` | ![#AAAAAA](https://via.placeholder.com/15/AAAAAA/000000?text=+) Light gray |
|  8 | `0b1000` | `#880000` | ![#880000](https://via.placeholder.com/15/880000/000000?text=+) Bordeaux   |
| 10 | `0b1010` | `#000088` | ![#000088](https://via.placeholder.com/15/000088/000000?text=+) Navy       |

#### Planes 2 and 3

|  # | Binary # | HEX colour | Colour                                                                    |
|----|----------|-----------|----------------------------------------------------------------------------|
|  0 | `0b0000` | `#000000` | ![#000000](https://via.placeholder.com/15/000000/000000?text=+) Black      |
|  4 | `0b0100` | `#FF0000` | ![#FF0000](https://via.placeholder.com/15/FF0000/000000?text=+) Red        |
|  8 | `0b1000` | `#880000` | ![#880000](https://via.placeholder.com/15/880000/000000?text=+) Bordeaux   |
| 12 | `0b1100` | `#FF00FF` | ![#FF00FF](https://via.placeholder.com/15/FF00FF/000000?text=+) Pink       |

#### Planes 0, 1 and 2


|  # | Binary # | HEX colour | Colour                                                                    |
|----|----------|-----------|----------------------------------------------------------------------------|
|  0 | `0b0000` | `#000000` | ![#000000](https://via.placeholder.com/15/000000/000000?text=+) Black      |
|  1 | `0b0001` | `#FFFFFF` | ![#FFFFFF](https://via.placeholder.com/15/FFFFFF/000000?text=+) White      |
|  2 | `0b0010` | `#AAAAAA` | ![#AAAAAA](https://via.placeholder.com/15/AAAAAA/000000?text=+) Light gray |
|  3 | `0b0011` | `#555555` | ![#555555](https://via.placeholder.com/15/555555/000000?text=+) Dark gray  |
|  4 | `0b0100` | `#FF0000` | ![#FF0000](https://via.placeholder.com/15/FF0000/000000?text=+) Red        |
|  5 | `0b0101` | `#00FF00` | ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) Green      |
|  6 | `0b0110` | `#0000FF` | ![#0000FF](https://via.placeholder.com/15/0000FF/000000?text=+) Blue       |
|  7 | `0b0111` | `#FFFF00` | ![#FFFF00](https://via.placeholder.com/15/FFFF00/000000?text=+) Yellow     |

#### Planes 0, 1 and 3

|  # | Binary # | HEX colour | Colour                                                                    |
|----|----------|-----------|----------------------------------------------------------------------------|
|  0 | `0b0000` | `#000000` | ![#000000](https://via.placeholder.com/15/000000/000000?text=+) Black      |
|  1 | `0b0001` | `#FFFFFF` | ![#FFFFFF](https://via.placeholder.com/15/FFFFFF/000000?text=+) White      |
|  2 | `0b0010` | `#AAAAAA` | ![#AAAAAA](https://via.placeholder.com/15/AAAAAA/000000?text=+) Light gray |
|  3 | `0b0011` | `#555555` | ![#555555](https://via.placeholder.com/15/555555/000000?text=+) Dark gray  |
|  8 | `0b1000` | `#880000` | ![#880000](https://via.placeholder.com/15/880000/000000?text=+) Bordeaux   |
|  9 | `0b1001` | `#008800` | ![#008800](https://via.placeholder.com/15/008800/000000?text=+) Olive      |
| 10 | `0b1010` | `#000088` | ![#000088](https://via.placeholder.com/15/000088/000000?text=+) Navy       |
| 11 | `0b1011` | `#888800` | ![#888800](https://via.placeholder.com/15/888800/000000?text=+) Orange     |

#### Planes 0, 2 and 3

|  # | Binary # | HEX colour | Colour                                                                    |
|----|----------|-----------|----------------------------------------------------------------------------|
|  0 | `0b0000` | `#000000` | ![#000000](https://via.placeholder.com/15/000000/000000?text=+) Black      |
|  1 | `0b0001` | `#FFFFFF` | ![#FFFFFF](https://via.placeholder.com/15/FFFFFF/000000?text=+) White      |
|  4 | `0b0100` | `#FF0000` | ![#FF0000](https://via.placeholder.com/15/FF0000/000000?text=+) Red        |
|  5 | `0b0101` | `#00FF00` | ![#00FF00](https://via.placeholder.com/15/00FF00/000000?text=+) Green      |
|  8 | `0b1000` | `#880000` | ![#880000](https://via.placeholder.com/15/880000/000000?text=+) Bordeaux   |
|  9 | `0b1001` | `#008800` | ![#008800](https://via.placeholder.com/15/008800/000000?text=+) Olive      |
| 12 | `0b1100` | `#FF00FF` | ![#FF00FF](https://via.placeholder.com/15/FF00FF/000000?text=+) Pink       |
| 13 | `0b1101` | `#00FFFF` | ![#00FFFF](https://via.placeholder.com/15/00FFFF/000000?text=+) Cyan       |

#### Planes 1, 2 and 3

|  # | Binary # | HEX colour | Colour                                                                    |
|----|----------|-----------|----------------------------------------------------------------------------|
|  0 | `0b0000` | `#000000` | ![#000000](https://via.placeholder.com/15/000000/000000?text=+) Black      |
|  2 | `0b0010` | `#AAAAAA` | ![#AAAAAA](https://via.placeholder.com/15/AAAAAA/000000?text=+) Light gray |
|  4 | `0b0100` | `#FF0000` | ![#FF0000](https://via.placeholder.com/15/FF0000/000000?text=+) Red        |
|  6 | `0b0110` | `#0000FF` | ![#0000FF](https://via.placeholder.com/15/0000FF/000000?text=+) Blue       |
|  8 | `0b1000` | `#880000` | ![#880000](https://via.placeholder.com/15/880000/000000?text=+) Bordeaux   |
| 10 | `0b1010` | `#000088` | ![#000088](https://via.placeholder.com/15/000088/000000?text=+) Navy       |
| 12 | `0b1100` | `#FF00FF` | ![#FF00FF](https://via.placeholder.com/15/FF00FF/000000?text=+) Pink       |
| 14 | `0b1110` | `#880088` | ![#880088](https://via.placeholder.com/15/880088/000000?text=+) Purple     |

## Conclusion so far

I'm not overly happy with the current "sub-palettes", so I think a redo may be
in order. But probably not any time soon 😄
