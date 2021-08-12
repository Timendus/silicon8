package main

import (
	"silicon8"
	"math/rand"
	// "github.com/therecipe/qt/core"
	// "github.com/therecipe/qt/gui"
	"github.com/therecipe/qt/widgets"
)

var cpu silicon8.CPU

func main() {
	cpu = silicon8.CPU{}
	cpu.Reset(silicon8.VIP)
	cpu.RegisterRandomGenerator(func() uint8 { return uint8(rand.Intn(256)) })
	cpu.Start()

	var window = widgets.NewQMainWindow(nil, 0)
	window.SetWindowTitle("Sprite Editor")
	window.SetMinimumSize2(360, 520)
	window.Show()
}
