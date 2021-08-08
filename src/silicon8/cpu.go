package silicon8

/*
 TODO:
	* SCHIP opcodes
		* 16x16 sprites
	* XO-CHIP opcodes
		* plane n (opcode works, but draw routine only draws to plane 1)
*/

import "time"

func (cpu *CPU) Start() {
	go func() {
		for {
			time.Sleep(1000 / 60 * time.Millisecond)
			if cpu.dt > 0 {
				cpu.dt--
			}
			if cpu.st > 0 {
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
		}
	}()

	neverDone := make(chan bool)
	<-neverDone
}

func (cpu *CPU) Reset(interpreter int) {
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
	cpu.RAM = make([]uint8, cpu.RAMSize)
	cpu.stack = make([]uint16, cpu.stackSize)

	// Initialize internal variables
	for i := range cpu.Keyboard {
		cpu.Keyboard[i] = false
	}

	cpu.waitForKey = false
	cpu.WaitForInt = 0
	cpu.playing = false
	cpu.SD = true
	cpu.running = true
	cpu.plane = 1
	cpu.planes = 1

	// Determine quirks to use
	cpu.setQuirks()
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

func (cpu *CPU) initDisplay(width uint16, height uint16, planes uint8) {
	cpu.DispWidth = width
	cpu.DispHeight = height
	cpu.planes = planes
	cpu.DispSize = cpu.DispWidth * cpu.DispHeight / 8 * uint16(planes)
	cpu.Display = make([]uint8, cpu.DispSize)

	// Update outside world too
	if cpu.setDispRes != nil {
		cpu.setDispRes(int(width), int(height), int(planes))
	}
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

func (cpu *CPU) a(address uint16) uint16 {
	if address >= cpu.RAMSize {
		cpu.error("Program attempted to access RAM outside of memory")
		return 0
	}
	if address >= VIP_SCHIP_RAM_SIZE {
		cpu.bumpSpecType(XOCHIP)
	}
	return address
}

func (cpu *CPU) s(address uint8) uint8 {
	if address >= cpu.stackSize {
		cpu.error("Program attempted to access invalid stack memory")
		return 0
	}
	if cpu.stackSize == SCHIP_STACK_SIZE && address < (SCHIP_STACK_SIZE-DEFAULT_STACK_SIZE) {
		cpu.bumpSpecType(SCHIP)
	}
	return address
}

func (cpu *CPU) error(msg string) {
	cpu.warnAtCurrentPC(msg)
	cpu.DumpStatus()
	cpu.running = false
}

func (cpu *CPU) warnAtCurrentPC(msg string) {
	opcodeAddr := cpu.pc - 2
	var opcode uint16 = 0
	if opcodeAddr >= 0 && int(opcodeAddr) < len(cpu.RAM) {
		opcode = uint16(cpu.RAM[opcodeAddr])<<8 | uint16(cpu.RAM[opcodeAddr+1])
	}
	warn(msg, opcodeAddr, opcode)
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
