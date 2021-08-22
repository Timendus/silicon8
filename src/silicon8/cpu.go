package silicon8

func (cpu *CPU) Start() {
	cpu.running = true
}

func (cpu *CPU) Stop() {
	cpu.running = false
}

func (cpu *CPU) SetCyclesPerFrame(cycles int) {
	cpu.cyclesPerFrame = cycles
}

func (cpu *CPU) ClockTick() {
	// Tick timers
	if cpu.dt > 0 {
		cpu.dt--
	}

	if cpu.st > 0 && cpu.soundEnabled {
		if !cpu.playing {
			cpu.playing = true
			cpu.playSound()
		}
		cpu.st--
	} else {
		if cpu.playing {
			cpu.playing = false
			cpu.stopSound()
		}
	}

	// Run cycles
	for i := 0; i < cpu.cyclesPerFrame; i++ {
		cpu.Cycle()
	}

	// Render display if dirty
	if cpu.SD {
		cpu.RenderToDisplayBuffer()
		cpu.render(int(cpu.DispWidth), int(cpu.DispHeight), cpu.Display)
		cpu.SD = false
	}

	// Register display redraw interrupt for dispQuirk
	if cpu.WaitForInt == 1 {
		cpu.WaitForInt = 2
	}
}

func (cpu *CPU) Reset(interpreter int) {
	cpu.Stop()

	if interpreter != AUTO {
		cpu.specType = interpreter
		cpu.typeFixed = true
	} else {
		cpu.specType = VIP
		cpu.typeFixed = false
	}

	switch interpreter {
	case STRICTVIP:
		cpu.RAMSize = STRICTVIP_RAM_SIZE
		cpu.stackSize = DEFAULT_STACK_SIZE
	case VIP, BLINDVIP:
		cpu.RAMSize = VIP_SCHIP_RAM_SIZE
		cpu.stackSize = DEFAULT_STACK_SIZE
	case SCHIP:
		cpu.RAMSize = VIP_SCHIP_RAM_SIZE
		cpu.stackSize = SCHIP_STACK_SIZE
	case XOCHIP:
		cpu.RAMSize = XOCHIP_RAM_SIZE
		cpu.stackSize = DEFAULT_STACK_SIZE
	case AUTO: // Takes maximum sizes, determines limits at runtime
		cpu.RAMSize = XOCHIP_RAM_SIZE
		cpu.stackSize = SCHIP_STACK_SIZE
	}

	// Initialize registers
	cpu.pc = 0x0200
	cpu.sp = cpu.stackSize - 1
	cpu.dt = 0
	cpu.st = 0

	// Initialize memory
	cpu.initDisplay(64, 32, 1)
	cpu.stack = make([]uint16, cpu.stackSize)
	cpu.planeBuffer = make([]uint8, 128 * 64) // Make space for the max display
	cpu.Display = make([]uint8, 128 * 64 * 3) // size, we'll use the relevant part
	cpu.RAM = make([]uint8, cpu.RAMSize)

	// Initialize internal variables
	for i := range cpu.Keyboard {
		cpu.Keyboard[i] = false
	}

	cpu.waitForKey = false
	cpu.WaitForInt = 0
	cpu.playing = false
	cpu.soundEnabled = true
	cpu.SD = true
	cpu.running = true
	cpu.plane = 1
	cpu.planes = 1
	cpu.cyclesPerFrame = 30

	// Determine quirks to use
	cpu.setQuirks()

	cpu.Start()
}

func (cpu *CPU) setQuirks() {
	cpu.shiftQuirk = cpu.specType == SCHIP
	cpu.jumpQuirk = cpu.specType == SCHIP
	cpu.memQuirk = cpu.specType != SCHIP
	cpu.vfQuirk = cpu.specType == VIP || cpu.specType == STRICTVIP || cpu.specType == BLINDVIP
	cpu.clipQuirk = cpu.specType != XOCHIP
	cpu.dispQuirk = cpu.specType == VIP || cpu.specType == STRICTVIP
	cpu.drawQuirk = cpu.specType == STRICTVIP
}

func (cpu *CPU) DumpStatus() {
	println("Status dump:")
	println("   pc:", cpu.pc, "sp:", cpu.sp, "i:", cpu.i, "dt:", cpu.dt, "st:", cpu.st)
	for i := range cpu.v {
		if i < 10 {
			print("   v", i, ":  ", cpu.v[i], "\n")
		} else {
			print("   v", i, ": ", cpu.v[i], "\n")
		}
	}
	println("Quirks flags:")
	println("   shiftQuirk:", cpu.shiftQuirk)
	println("   jumpQuirk: ", cpu.jumpQuirk)
	println("   memQuirk:  ", cpu.memQuirk)
	println("   vfQuirk:   ", cpu.vfQuirk)
	println("   clipQuirk: ", cpu.clipQuirk)
	println("   dispQuirk: ", cpu.dispQuirk)
	println("   drawQuirk: ", cpu.drawQuirk)
}

func (cpu *CPU) bumpSpecType(newType int) {
	if cpu.typeFixed {
		return
	}
	if newType > cpu.specType {
		cpu.specType = newType
		cpu.setQuirks()
		switch newType {
		case SCHIP:
			cpu.warnAtCurrentPC("Auto-upgraded interpreter to SCHIP")
		case XOCHIP:
			cpu.warnAtCurrentPC("Auto-upgraded interpreter to XOCHIP")
		}
	}
}
