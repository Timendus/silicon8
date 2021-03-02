# Silicon8

This is my first experiment with WebAssembly and with Go. So I'll probably look
back on this repository with shame in a very short amount of time 😉 But that's
the point of this, this is a learning project for me.

Silicon8 is an implementation of a runtime for Chip-8, SCHIP and XO-Chip in Go
that can run as a standard Go module, or be compiled to WebAssembly with TinyGo.
It's still missing a couple of features and instructions, and I'm sure there's
still a few problems here and there on the Chip interpretation side of things.
But most of the hard WASM/Go/JavaScript boundary related stuff is done.

The interpreter currently builds and runs as WebAssembly on NodeJS in the
terminal with `npm start`. You'll have to hard-code a file to load in `run.js`.
I'm still playing with a pure Go front-end, and the browser front-end is also
still a to do. But I can probably use this pretty much as a drop-in replacement
for my existing [web based Chip-8 play thing](https://github.com/Timendus/chip-8).

We'll see where this goes 😄
