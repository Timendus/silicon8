import run from "./test-helper.js";
import types from "../docs/js/shared/types";

run({
  type: types.BLINDVIP,
  rom: "./tests/abc.ch8",
  cycles: 30,
  test: (ram, display) => {
    describe("abc.ch8", () => {
      test("shows ABC on the display", () => {
        // expect(display).toRenderTo("./tests/abc.bmp");
        expect(display).toLookLike("./tests/abc.bmp");
      });
    });
  },
});
