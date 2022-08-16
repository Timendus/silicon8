package silicon8

import "math"

// Run the CPU for one cycle and return control

func (cpu *CPU) Cycle() {
	if !cpu.running {
		return
	}

	var op uint16 = uint16(cpu.RAM[cpu.a(cpu.pc)])<<8 | uint16(cpu.RAM[cpu.a(cpu.pc+1)])
	var x uint8 = cpu.RAM[cpu.a(cpu.pc)] & 0x0F
	var y uint8 = cpu.RAM[cpu.a(cpu.pc+1)] & 0xF0 >> 4
	var n uint8 = cpu.RAM[cpu.a(cpu.pc+1)] & 0x0F
	var nn uint8 = cpu.RAM[cpu.a(cpu.pc+1)] & 0xFF
	var nnn uint16 = uint16(x)<<8 | uint16(nn)

	info("Processing instruction", cpu.pc, op)
	cpu.pc += 2

	switch op & 0xF000 {
	case 0x0000:
		cpu.machineCall(op, n)
	case 0x1000:
		// Jump
		cpu.pc = nnn
	case 0x2000:
		// Call
		cpu.stack[cpu.s(cpu.sp)] = cpu.pc
		cpu.sp--
		cpu.pc = nnn
	case 0x3000:
		if cpu.v[x] == nn {
			cpu.skipNextInstruction()
		}
	case 0x4000:
		if cpu.v[x] != nn {
			cpu.skipNextInstruction()
		}
	case 0x5000:
		if x > y {
			n := x
			x = y
			y = n
		}

		switch n {
		case 2:
			// Store range of registers to memory
			for i := x; i <= y; i++ {
				cpu.RAM[cpu.a(cpu.i+uint16(i-x))] = cpu.v[i]
			}
			cpu.bumpSpecType(XOCHIP)
		case 3:
			// Load range of registers from memory
			for i := x; i <= y; i++ {
				cpu.v[i] = cpu.RAM[cpu.a(cpu.i+uint16(i-x))]
			}
			cpu.bumpSpecType(XOCHIP)
		case 4:
			// Load range of palette "registers" from memory
			for i := x; i <= y; i++ {
				cpu.palette[i] = cpu.RAM[cpu.a(cpu.i+uint16(i-x))]
			}
			cpu.bumpSpecType(XOCHIP)
		default:
			if cpu.v[x] == cpu.v[y] {
				cpu.skipNextInstruction()
			}
		}
	case 0x6000:
		// Set register
		cpu.v[x] = nn
	case 0x7000:
		// Add to register
		cpu.v[x] += nn
	case 0x8000:
		cpu.maths(x, y, n)
	case 0x9000:
		if cpu.v[x] != cpu.v[y] {
			cpu.skipNextInstruction()
		}
	case 0xA000:
		// Set i
		cpu.i = nnn
	case 0xB000:
		// Jump to i + "v0"
		if cpu.jumpQuirk {
			cpu.pc = nnn + uint16(cpu.v[x])
		} else {
			cpu.pc = nnn + uint16(cpu.v[0])
		}
	case 0xC000:
		// Set register to random number
		cpu.v[x] = cpu.random() & nn
	case 0xD000:
		// Draw sprite to the screen
		cpu.draw(x, y, n)
	case 0xE000:
		switch nn {
		case 0x9E:
			if cpu.Keyboard[cpu.v[x]] {
				cpu.skipNextInstruction()
			}
		case 0xA1:
			if !cpu.Keyboard[cpu.v[x]] {
				cpu.skipNextInstruction()
			}
		}
	case 0xF000:

		switch nn {
		case 0x00:
			// Set i register to 16-bit value
			cpu.i = uint16(cpu.RAM[cpu.a(cpu.pc)])<<8 | uint16(cpu.RAM[cpu.a(cpu.pc+1)])
			cpu.pc += 2
			cpu.bumpSpecType(XOCHIP)
		case 0x01:
			// Enable the second plane if it hasn't been enabled yet
			if cpu.planes == 1 {
				cpu.initDisplay(cpu.DispWidth, cpu.DispHeight, 2)
			}
			// Select plane X
			cpu.plane = x
			cpu.bumpSpecType(XOCHIP)
		case 0x02:
			// XO-Chip: Load 16 bytes of audio buffer from (i)
			var i uint16
			for i = 0; i < 16; i++ {
				cpu.pattern[i] = cpu.RAM[cpu.a(cpu.i+i)]
			}
			cpu.playingPattern = true
			cpu.audioDirty = true
			cpu.bumpSpecType(XOCHIP)
		case 0x07:
			// Set register to value of delay timer
			cpu.v[x] = cpu.dt
		case 0x0A:
			// Wait for keypress and return key in vX
			switch cpu.waitForKey {
			case 0:
				cpu.pc -= 2
				for _, p := range cpu.Keyboard {
					if p {
						return
					}
				}
				cpu.waitForKey = 1
			case 1:
				cpu.pc -= 2
				for i, p := range cpu.Keyboard {
					if p {
						cpu.v[x] = uint8(i)
						cpu.waitForKey = 2
						return
					}
				}
			case 2:
				for _, p := range cpu.Keyboard {
					if p {
						cpu.pc -= 2
						return
					}
				}
				cpu.waitForKey = 0
			}
		case 0x15:
			// Set delay timer to value in vX
			cpu.dt = cpu.v[x]
		case 0x18:
			// Set sound timer to value in vX
			cpu.st = cpu.v[x]
		case 0x1E:
			// Add vX to i register
			cpu.i += uint16(cpu.v[x])
		case 0x29:
			// Set i register to font data
			cpu.i = uint16(cpu.v[x] * 5)
		case 0x30:
			// Set i register to large font data
			cpu.i = uint16(cpu.v[x]*10) + 80
			cpu.bumpSpecType(SCHIP)
		case 0x33:
			// Binary coded decimal from vX to address in i
			cpu.RAM[cpu.a(cpu.i+0)] = cpu.v[x] / 100
			cpu.RAM[cpu.a(cpu.i+1)] = cpu.v[x] % 100 / 10
			cpu.RAM[cpu.a(cpu.i+2)] = cpu.v[x] % 10
		case 0x3A:
			// XO-Chip: Change pitch of audio pattern
			cpu.pitch = 4000 * math.Pow(2, (float64(cpu.v[x])-64)/48)
			cpu.playingPattern = true
			cpu.audioDirty = true
			cpu.bumpSpecType(XOCHIP)
		case 0x55:
			// Store registers to memory (regular VIP/SCHIP)
			var i uint8
			for i = 0; i <= x; i++ {
				cpu.RAM[cpu.a(cpu.i+uint16(i))] = cpu.v[i]
			}
			if cpu.memQuirk {
				cpu.i += uint16(x) + 1
			}
		case 0x65:
			// Load registers from memory (regular VIP/SCHIP)
			var i uint8
			for i = 0; i <= x; i++ {
				cpu.v[i] = cpu.RAM[cpu.a(cpu.i+uint16(i))]
			}
			if cpu.memQuirk {
				cpu.i += uint16(x) + 1
			}
		case 0x75:
			// Store registers to "user flags" (SCHIP)
			var i uint8
			for i = 0; i <= x; i++ {
				cpu.userFlags[i] = cpu.v[i]
			}
			cpu.bumpSpecType(SCHIP)
		case 0x85:
			// Load registers from "user flags" (SCHIP)
			var i uint8
			for i = 0; i <= x; i++ {
				cpu.v[i] = cpu.userFlags[i]
			}
			cpu.bumpSpecType(SCHIP)
		}

	}
}

func (cpu *CPU) machineCall(op uint16, n uint8) {
	switch op & 0xFFF0 {
	case 0x00C0:
		cpu.scrollDown(n)
		cpu.bumpSpecType(SCHIP)
		return
	case 0x00D0:
		cpu.scrollUp(n)
		cpu.bumpSpecType(XOCHIP)
		return
	}

	switch op {
	case 0x00E0:
		cpu.clearScreen()
	case 0x00EE:
		// Return
		cpu.sp++
		cpu.pc = cpu.stack[cpu.s(cpu.sp)]
	case 0x00FB:
		cpu.scrollRight()
		cpu.bumpSpecType(SCHIP)
	case 0x00FC:
		cpu.scrollLeft()
		cpu.bumpSpecType(SCHIP)
	case 0x00FD:
		// "Exit" interpreter. Will just halt in our implementation
		cpu.running = false
		cpu.bumpSpecType(SCHIP)
	case 0x00FE:
		// Set normal screen resolution
		cpu.initDisplay(64, 32, cpu.planes)
		cpu.clearPlanes(0)
		cpu.bumpSpecType(SCHIP)
	case 0x00FF:
		// Set extended screen resolution
		cpu.initDisplay(128, 64, cpu.planes)
		cpu.clearPlanes(0)
		cpu.bumpSpecType(SCHIP)
	default:
		warn("RCA 1802 assembly calls not supported", cpu.pc-2, op)
		cpu.DumpStatus()
		cpu.running = false
	}
}

func (cpu *CPU) maths(x, y, n uint8) {
	switch n {
	case 0x0:
		cpu.v[x] = cpu.v[y]
	case 0x1:
		cpu.v[x] |= cpu.v[y]
		if cpu.vfQuirk {
			cpu.v[0xF] = 0
		}
	case 0x2:
		cpu.v[x] &= cpu.v[y]
		if cpu.vfQuirk {
			cpu.v[0xF] = 0
		}
	case 0x3:
		cpu.v[x] ^= cpu.v[y]
		if cpu.vfQuirk {
			cpu.v[0xF] = 0
		}
	case 0x4:
		// Add register vY to vX
		// Set VF to 01 if a carry occurs
		// Set VF to 00 if a carry does not occur
		flag := (0xFF - cpu.v[x]) < cpu.v[y]
		cpu.v[x] += cpu.v[y]
		cpu.setFlag(flag)
	case 0x5:
		// Subtract register vY from vX and store in vX
		// Set VF to 00 if a borrow occurs
		// Set VF to 01 if a borrow does not occur
		flag := cpu.v[x] >= cpu.v[y]
		cpu.v[x] -= cpu.v[y]
		cpu.setFlag(flag)
	case 0x6:
		// Shift right
		if cpu.shiftQuirk {
			y = x
		}
		// Set register VF to the least significant bit prior to the shift
		flag := cpu.v[y]&0b00000001 > 0
		cpu.v[x] = cpu.v[y] >> 1
		cpu.setFlag(flag)
	case 0x7:
		// Subtract register vX from vY and store in vX
		// Set VF to 00 if a borrow occurs
		// Set VF to 01 if a borrow does not occur
		flag := cpu.v[y] >= cpu.v[x]
		cpu.v[x] = cpu.v[y] - cpu.v[x]
		cpu.setFlag(flag)
	case 0xE:
		// Shift left
		if cpu.shiftQuirk {
			y = x
		}
		// Set register VF to the most significant bit prior to the shift
		flag := cpu.v[y]&0b10000000 > 0
		cpu.v[x] = cpu.v[y] << 1
		cpu.setFlag(flag)
	}
}

func (cpu *CPU) skipNextInstruction() {
	nextInstruction := uint16(cpu.RAM[cpu.a(cpu.pc)])<<8 | uint16(cpu.RAM[cpu.a(cpu.pc+1)])
	if nextInstruction == 0xF000 {
		// Next instruction is a 4-byte "Set i to 16-bit value"
		cpu.pc += 4
	} else {
		cpu.pc += 2
	}
}

func (cpu *CPU) setFlag(comparison bool) {
	cpu.v[0xF] = 0
	if comparison {
		cpu.v[0xF] = 1
	}
}
