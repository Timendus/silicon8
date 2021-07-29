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
./run.js ./tests/abc.ch8 # Should run the emulator with a given CHIP-8 binary
```

Key `Q` or `Ctrl+C` exits the emulator.

### How to serve the website

```bash
npm install
npm run serve # Should serve the website on localhost:8080
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
