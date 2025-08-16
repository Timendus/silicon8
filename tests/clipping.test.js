import run from "./test-helper.js";
import types from "../docs/js/shared/types";

describe("clipping-xochip.ch8", () => {
  run({
    type: types.XOCHIP,
    rom: "./tests/clipping-xochip.ch8",
    cycles: 11,
    test: (ram, display) => {
      describe("in low resolution mode", () => {
        test("shows sprites wrapping around all screen edges", () => {
          // expect(display).toRenderTo("./tests/clipping-xochip-lowres.bmp");
          expect(display).toLookLike("./tests/clipping-xochip-lowres.bmp");
        });
      });
    },
  });

  run({
    type: types.XOCHIP,
    rom: "./tests/clipping-xochip.ch8",
    cycles: 22,
    test: (ram, display) => {
      describe("in high resolution mode", () => {
        test("shows sprites wrapping around all screen edges", () => {
          // expect(display).toRenderTo("./tests/clipping-xochip-hires.bmp");
          expect(display).toLookLike("./tests/clipping-xochip-hires.bmp");
        });
      });
    },
  });
});

describe("clipping-schip.ch8", () => {
  run({
    type: types.SCHIP,
    rom: "./tests/clipping-schip.ch8",
    cycles: 10,
    test: (ram, display) => {
      describe("in low resolution mode", () => {
        test("shows sprites clipping at screen edges", () => {
          // expect(display).toRenderTo("./tests/clipping-schip-lowres.bmp");
          expect(display).toLookLike("./tests/clipping-schip-lowres.bmp");
        });
      });
    },
  });

  run({
    type: types.SCHIP,
    rom: "./tests/clipping-schip.ch8",
    cycles: 21,
    test: (ram, display) => {
      describe("in high resolution mode", () => {
        test("shows sprites clipping at screen edges", () => {
          // expect(display).toRenderTo("./tests/clipping-schip-hires.bmp");
          expect(display).toLookLike("./tests/clipping-schip-hires.bmp");
        });
      });
    },
  });
});
