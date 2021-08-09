package main

// This is the wrapper code to use Silicon8 as WebAssembly with TinyGo

import "silicon8"

// We currently support a single CPU
var cpu silicon8.CPU

func main() {
	cpu = silicon8.CPU{}
	cpu.RegisterSoundCallbacks(playSound, stopSound)
	cpu.RegisterRandomGenerator(func() uint8 { return uint8(randomByte()) })
	cpu.RegisterDisplayCallback(render)
}

// To implement in host environment:

func playSound()
func stopSound()
func randomByte() int  // This too, because math/rand gives weird errors with tinygo
func render(int, int, []uint8) // width, height, pointer to display data

// API for use in the host environment:

//export start
func start() {
	cpu.Start()
}

//export stop
func stop() {
	cpu.Stop()
}

//export reset
func reset(cpuType int) {
	cpu.Reset(cpuType)
}

//export ramPtr
func ramPtr() *uint8 {
	return &cpu.RAM[0]
}

//export ramSize
func ramSize() uint16 {
	return cpu.RAMSize
}

//export clockTick
func clockTick() {
	cpu.ClockTick()
}

//export pressKey
func pressKey(key uint8) {
	if key < 16 { cpu.Keyboard[key] = true }
}

//export releaseKey
func releaseKey(key uint8) {
	if key < 16 { cpu.Keyboard[key] = false }
}

//export setCyclesPerFrame
func setCyclesPerFrame(cycles int) {
	cpu.SetCyclesPerFrame(cycles)
}

//export dumpStatus
func dumpStatus() {
	cpu.DumpStatus();
}

// For testing purposes only:

//export runCycles
func runCycles(num int) {
	for i := 0; i < num; i++ {
		cpu.Cycle()
	}
}

//export displayPtr
func displayPtr() *uint8 {
	return &cpu.Display[0]
}

//export displaySize
func displaySize() uint16 {
	return cpu.DispSize
}
