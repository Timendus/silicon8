package main

import "silicon8"

/*
 TODO:
  * Export the rest of the state?
*/

// We support a single CPU for now
var cpu silicon8.CPU

func main() {
  cpu = silicon8.CPU{}
  cpu.Reset(silicon8.VIP)
  cpu.RegisterSoundCallbacks(playSound, stopSound)
  cpu.RegisterRandomGenerator(func() uint8 { return uint8(randomByte()) })
  cpu.Start()
}

// To implement in host environment

func playSound()
func stopSound()
func randomByte() int  // This too, because math/rand gives weird errors with tinygo

// The rest of this file is the API for the host environment

//export initialize
func initialize(cpuType int) {
  cpu.Reset(cpuType)
}

//export dumpStatus
func dumpStatus() {
  cpu.DumpStatus();
}

//export cycles
func cycles(num int) {
  for i := 0; i < num; i++ {
    cpu.Step()
  }
}

//export ramPtr
func ramPtr() *uint8 {
  return &cpu.RAM[0]
}

//export ramSize
func ramSize() uint16 {
  return cpu.RAMSize
}

//export displayPtr
func displayPtr() *uint8 {
  return &cpu.Display[0]
}

//export displaySize
func displaySize() uint16 {
  return cpu.DispSize
}

// Call this routine on each rendering loop, both to check if you need to redraw
// the screen, and to trigger the screen refresh "interrupt" when `dispQuirk` is
// enabled.
//export screenDirty
func screenDirty() bool {
  if cpu.WaitForInt == 1 {
    cpu.WaitForInt = 2
  }
  return cpu.SD
}

//export setScreenClean
func setScreenClean() {
  cpu.SD = false
}

//export pressKey
func pressKey(key uint8) {
  if key < 16 { cpu.Keyboard[key] = true }
}

//export releaseKey
func releaseKey(key uint8) {
  if key < 16 { cpu.Keyboard[key] = false }
}
