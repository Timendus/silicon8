import run from "./test-helper.js";
import types from "../docs/js/shared/types";

describe("on VIP", () => {
  run({
    type: types.BLINDVIP,
    rom: "./tests/jump0.ch8",
    cycles: 10,
    test: (ram, display) => {
      describe("jump0.ch8", () => {
        test("jumps to the eighth entry in the jump table", () => {
          expect(ram[0x400]).toBe(8);
        });
      });
    },
  });
});

describe("on SCHIP", () => {
  run({
    type: types.SCHIP,
    rom: "./tests/jump0.ch8",
    cycles: 10,
    test: (ram, display) => {
      describe("jump0.ch8", () => {
        test("jumps to the second entry in the jump table", () => {
          expect(ram[0x400]).toBe(2);
        });
      });
    },
  });
});
