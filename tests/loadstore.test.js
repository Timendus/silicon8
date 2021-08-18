const {types, run} = require('./test-helper');

describe('on VIP', () => {
  run({
    type: types.BLINDVIP,
    rom: './tests/loadstore.ch8',
    cycles: 15,
    test: (ram, display) => {
      describe('loadstore.ch8', () => {
        test('stores in memory and advances i', () => {
          expect(ram.slice(0x400, 0x404)).toEqual([
            0xAA, 0x55, 0xAA, 0x55
          ]);
        });
        test('reads from memory and advances i', () => {
          expect(ram.slice(0x404, 0x408)).toEqual([
            0x60, 0xAA, 0xA4, 0x00
          ]);
        });
      });
    }
  });
});

describe('on SCHIP', () => {
  run({
    type: types.SCHIP,
    rom: './tests/loadstore.ch8',
    cycles: 15,
    test: (ram, display) => {
      describe('loadstore.ch8', () => {
        test('stores in memory in the same place twice', () => {
          expect(ram.slice(0x400, 0x404)).toEqual([
            0xAA, 0x55, 0x00, 0x00
          ]);
        });
        test('reads from memory in the same place twice', () => {
          expect(ram.slice(0x404, 0x408)).toEqual([
            0xA4, 0x00, 0xA4, 0x00
          ]);
        });
      });
    }
  });
});
