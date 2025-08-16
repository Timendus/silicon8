import run from "./test-helper.js";
import types from "../docs/js/shared/types";

run({
  type: types.XOCHIP,
  rom: "./tests/all-colours.ch8",
  cycles: 200,
  test: (ram, display) => {
    describe("all-colours.ch8", () => {
      test("shows a grid with the available colours on the display", () => {
        // expect(display).toRenderTo("./tests/all-colours.bmp");
        expect(display).toLookLike("./tests/all-colours.bmp");
      });
    });
  },
});
