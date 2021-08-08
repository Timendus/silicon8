# Silicon8

Silicon8 is an implementation of a runtime for Chip-8, SCHIP and XO-Chip in Go
that can run as a standard Go module, or be compiled to WebAssembly with TinyGo.
Please note that it is currently a work in progress, and far from perfect.

This is my first experiment with WebAssembly and with Go. So I'll probably look
back on this repository with shame in a very short amount of time 😉 But that's
the point of this, this is a learning project for me.

## Developer instructions

### How to run

To try it running in your browser, visit https://timendus.github.io/silicon8/ and drag a CHIP-8 ROM file onto the monitor.

In the console, using NodeJS:

```bash
git clone git@github.com:Timendus/silicon8.git
cd silicon8
./run.js ./tests/abc.ch8 # Should run the interpreter with a given CHIP-8 binary
```

Key `Q` or `Ctrl+C` exits the interpreter.

### How to serve the website

```bash
npm install
npm run serve # Should serve the web version on localhost:8080
```

### How to build

```bash
brew install tinygo # Or use your own favourite package manager
npm run build # Should rebuild the WebAssembly Go module
```

### How to test

```bash
npm install
npm test # Should run the tests
```

## Development log

### March 2021

It's still missing a couple of features and instructions, and I'm sure there's
still a few problems here and there on the Chip interpretation side of things.
But most of the hard WASM/Go/JavaScript boundary related stuff is done.

The interpreter currently builds and runs as WebAssembly on NodeJS in the
terminal with `npm start`. You'll have to hard-code a file to load in `run.js`.
I'm still playing with a pure Go front-end, and the browser front-end is also
still a to do. But I can probably use this pretty much as a drop-in replacement
for my existing [web based Chip-8 play thing](https://github.com/Timendus/chip-8).

We'll see where this goes 😄

### July 2021

Alright, having a couple of days off, it's time to finish(?) this project 😉

First, I added the ability to provide it with a CHIP-8 binary of your choice as
a command line parameter. Having to hard-code the ROM has annoyed me for a
while.

Second, it was time to start finding the interpretation issues that were still
present, so I decided to start writing some automated tests. After about a week
of writing tests and fixing bugs here and there, on and off, I think I now feel
kind of safe saying that the interpreter works as it should for CHIP-8.

Also, I added a web-based front-end for the interpreter that works nicer and
looks better than the console based version.

Next up: Time to work on the SCHIP and XOCHIP features some more 😄

### August 2021

SCHIP high resolution mode works. Most instructions have been implemented (not
all have been tested) except for the 16 by 16 pixel sprites and XO-CHIP's four
colour mode. I'm going to refactor stuff a bit before I fix those, because I
intend to just hand the external runtime a colour bitmap to render from the
(WebAssembly) Go package. That should make it easier to implement a runtime and
allows for a fancy 16-colour mode. In theory. We'll see 😄

I tried to add an auto-detect mode that tries to determine the version of CHIP-8
used at runtime. I figured that programs that use specific instructions or
access memory outside of the regular limits can be safely bumped to SCHIP or
XO-CHIP. The feature works, but the number of programs that are accurately
auto-detected is lower than I expected. A program can use none of the SCHIP
features, and still expect to be run on SCHIP with all the quirks of that
platform, for example. Same with developers writing programs for XO-CHIP without
actually using anything beyond CHIP-8 and SCHIP instructions. No way to tell.

