import "../lib/thimbleful.js";
import Emulator from "./emulator.js";
import keyboard from "./keyboard.js";
import gamepad from "./gamepad.js";
import settings from "./settings.js";
import display from "./display.js";
import types from "../shared/types.js";
import { playSound, stopSound } from "./sound.js";

window.addEventListener("load", async () => {
  const instance = new Emulator({ display, playSound, stopSound });
  await instance.init();
  keyboard(instance);
  gamepad(instance);
  const showSettings = settings(instance);

  const response = await fetch("../../welcome.ch8");
  const data = await response.bytes();
  const welcomeProgram = new Uint8Array(data);

  instance.loadProgram(types.AUTO, welcomeProgram);
  instance.start();

  const fileTarget = Thimbleful.FileTarget.instance();
  fileTarget.register("#display", (file, data) => {
    if (file.name.substr(-4) != ".ch8")
      return alert("You can only load *.ch8 CHIP-8 ROMs");
    data = atob(data.split(",")[1]);
    const program = new Uint8Array(new ArrayBuffer(data.length));
    for (let i = 0; i < data.length; i++) program[i] = data.charCodeAt(i);
    instance.stop();
    showSettings(program);
  });
});
