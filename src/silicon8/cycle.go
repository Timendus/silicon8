package silicon8

// Run the CPU for one cycle and return control

func (cpu *CPU) Cycle() {
	if !cpu.running {
		return
	}

	var op uint16 = uint16(cpu.RAM[cpu.A(cpu.pc)])<<8 | uint16(cpu.RAM[cpu.A(cpu.pc+1)])
	var x uint8 = cpu.RAM[cpu.A(cpu.pc)] & 0x0F
	var y uint8 = cpu.RAM[cpu.A(cpu.pc+1)] & 0xF0 >> 4
	var n uint8 = cpu.RAM[cpu.A(cpu.pc+1)] & 0x0F
	var nn uint8 = cpu.RAM[cpu.A(cpu.pc+1)] & 0xFF
	var nnn uint16 = uint16(x)<<8 | uint16(nn)

	info("Processing instruction", cpu.pc, op)
	cpu.pc += 2

	switch op & 0xF000 {
	case 0x0000:
		cpu.machineCall(op, n)
	case 0x1000:
		cpu.pc = nnn
	case 0x2000:
		cpu.Stack[cpu.S(cpu.sp)] = cpu.pc
		cpu.sp--
		cpu.pc = nnn
	case 0x3000:
		if cpu.v[x] == nn {
			cpu.pc += 2
		}
	case 0x4000:
		if cpu.v[x] != nn {
			cpu.pc += 2
		}
	case 0x5000:
		if x > y {
			n := x
			x = y
			y = n
		}

		switch n {
		case 2:
			for i := x; i <= y; i++ {
				cpu.RAM[cpu.A(cpu.i+uint16(i-x))] = cpu.v[i]
			}
			cpu.bumpSpecType(XOCHIP)
		case 3:
			for i := x; i <= y; i++ {
				cpu.v[i] = cpu.RAM[cpu.A(cpu.i+uint16(i-x))]
			}
			cpu.bumpSpecType(XOCHIP)
		default:
			if cpu.v[x] == cpu.v[y] {
				cpu.pc += 2
			}
		}
	case 0x6000:
		cpu.v[x] = nn
	case 0x7000:
		cpu.v[x] += nn
	case 0x8000:
		cpu.maths(x, y, n)
	case 0x9000:
		if cpu.v[x] != cpu.v[y] {
			cpu.pc += 2
		}
	case 0xA000:
		cpu.i = nnn
	case 0xB000:
		if cpu.jumpQuirk {
			cpu.pc = nnn + uint16(cpu.v[x])
		} else {
			cpu.pc = nnn + uint16(cpu.v[0])
		}
	case 0xC000:
		cpu.v[x] = cpu.random() & nn
	case 0xD000:
		cpu.draw(x, y, n)
	case 0xE000:
		switch nn {
		case 0x9E:
			if cpu.Keyboard[cpu.v[x]] {
				cpu.pc += 2
			}
		case 0xA1:
			if !cpu.Keyboard[cpu.v[x]] {
				cpu.pc += 2
			}
		}
	case 0xF000:

		switch nn {
		case 0x00:
			cpu.pc += 2
			cpu.i = uint16(cpu.RAM[cpu.A(cpu.pc)])<<8 | uint16(cpu.RAM[cpu.A(cpu.pc+1)])
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
			// Load 16 bytes of audio buffer from (i)
			// (No-op in our implementation, at least for now)
			cpu.bumpSpecType(XOCHIP)
		case 0x07:
			cpu.v[x] = cpu.dt
		case 0x0A:
			if cpu.waitForKey {
				for i, p := range cpu.Keyboard {
					if p {
						cpu.v[x] = uint8(i)
						cpu.waitForKey = false
						return
					}
				}
				cpu.pc -= 2
			} else {
				cpu.pc -= 2
				for _, p := range cpu.Keyboard {
					if p {
						return
					}
				}
				cpu.waitForKey = true
			}
		case 0x15:
			cpu.dt = cpu.v[x]
		case 0x18:
			cpu.st = cpu.v[x]
		case 0x1E:
			cpu.i += uint16(cpu.v[x])
		case 0x29:
			cpu.i = uint16(cpu.v[x] * 5)
		case 0x30:
			cpu.i = uint16(cpu.v[x]*10) + 80
			cpu.bumpSpecType(SCHIP)
		case 0x33:
			cpu.RAM[cpu.A(cpu.i+0)] = cpu.v[x] / 100
			cpu.RAM[cpu.A(cpu.i+1)] = cpu.v[x] % 100 / 10
			cpu.RAM[cpu.A(cpu.i+2)] = cpu.v[x] % 10
		case 0x55:
			var i uint8
			for i = 0; i <= x; i++ {
				cpu.RAM[cpu.A(cpu.i+uint16(i))] = cpu.v[i]
			}
			if cpu.memQuirk {
				cpu.i += uint16(x) + 1
			}
		case 0x65:
			var i uint8
			for i = 0; i <= x; i++ {
				cpu.v[i] = cpu.RAM[cpu.A(cpu.i+uint16(i))]
			}
			if cpu.memQuirk {
				cpu.i += uint16(x) + 1
			}
		case 0x75:
			var i uint8
			for i = 0; i <= x; i++ {
				cpu.userFlags[i] = cpu.v[i]
			}
			cpu.bumpSpecType(SCHIP)
		case 0x85:
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
		// Clear screen
		for i := range cpu.Display {
			cpu.Display[i] = 0
		}
		cpu.SD = true
	case 0x00EE:
		// Return
		cpu.sp++
		cpu.pc = cpu.Stack[cpu.S(cpu.sp)]
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
		cpu.bumpSpecType(SCHIP)
	case 0x00FF:
		// Set extended screen resolution
		cpu.initDisplay(128, 64, cpu.planes)
		cpu.bumpSpecType(SCHIP)
	default:
		warn("RCA 1802 assembly calls not supported", cpu.pc-2, op)
		cpu.DumpStatus()
		cpu.running = false
	}
}

func (cpu *CPU) scrollDown(n uint8) {
	for i := 8 * (32 - n); i > 8*n; i-- {
		cpu.Display[i+8*n] = cpu.Display[i]
	}
}

func (cpu *CPU) scrollUp(n uint8) {
	for i := 8 * n; i < 8*(32-n); i++ {
		cpu.Display[i-8*n] = cpu.Display[i]
	}
}

func (cpu *CPU) scrollLeft() {
	for y := 0; y < 32; y++ {
		for x := 0; x < 7; x++ {
			i := y*32 + x
			cpu.Display[i] = cpu.Display[i]<<4 | cpu.Display[i+1]>>4
		}
		i := y*32 + 7
		cpu.Display[i] = cpu.Display[i] << 4
	}
}

func (cpu *CPU) scrollRight() {
	for y := 0; y < 32; y++ {
		for x := 7; x > 0; x-- {
			i := y*32 + x
			cpu.Display[i] = cpu.Display[i]>>4 | cpu.Display[i-1]<<4
		}
		i := y * 32
		cpu.Display[i] = cpu.Display[i] >> 4
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
		// Set VF to 01 if a carry occurs
		// Set VF to 00 if a carry does not occur
		flag := (0xFF - cpu.v[x]) < cpu.v[y]
		cpu.v[x] += cpu.v[y]
		cpu.setFlag(flag)
	case 0x5:
		// Set VF to 00 if a borrow occurs
		// Set VF to 01 if a borrow does not occur
		flag := cpu.v[x] >= cpu.v[y]
		cpu.v[x] -= cpu.v[y]
		cpu.setFlag(flag)
	case 0x6:
		if cpu.shiftQuirk {
			y = x
		}
		// Set register VF to the least significant bit prior to the shift
		flag := cpu.v[y]&0b00000001 > 0
		cpu.v[x] = cpu.v[y] >> 1
		cpu.setFlag(flag)
	case 0x7:
		// Set VF to 00 if a borrow occurs
		// Set VF to 01 if a borrow does not occur
		flag := cpu.v[y] >= cpu.v[x]
		cpu.v[x] = cpu.v[y] - cpu.v[x]
		cpu.setFlag(flag)
	case 0xE:
		if cpu.shiftQuirk {
			y = x
		}
		// Set register VF to the most significant bit prior to the shift
		flag := cpu.v[y]&0b10000000 > 0
		cpu.v[x] = cpu.v[y] << 1
		cpu.setFlag(flag)
	}
}

func (cpu *CPU) setFlag(comparison bool) {
	cpu.v[0xF] = 0
	if comparison {
		cpu.v[0xF] = 1
	}
}

func (cpu *CPU) draw(x, y, n uint8) {
	if cpu.dispQuirk {
		switch cpu.WaitForInt {
		case 0:
			cpu.WaitForInt = 1
			cpu.pc -= 2
			return
		case 1:
			cpu.pc -= 2
			return
		case 2:
			cpu.WaitForInt = 0
		}
	}

	xPos := cpu.v[x]
	yPos := cpu.v[y]
	// Wrap around the screen
	for xPos >= uint8(cpu.DispWidth) {
		xPos -= uint8(cpu.DispWidth)
	}
	for yPos >= uint8(cpu.DispHeight) {
		yPos -= uint8(cpu.DispHeight)
	}
	topLeftOffset := uint16(yPos)*cpu.DispWidth/8 + uint16(xPos)/8
	erases := false
	planeSize := cpu.DispSize / uint16(cpu.planes)
	var i uint8
	for i = 0; i < n; i++ {
		sprite := cpu.RAM[cpu.A(cpu.i+uint16(i))]
		leftPart := sprite >> (xPos % 8)
		rightPart := sprite << (8 - (xPos % 8))
		dispOffset := uint16(topLeftOffset) + uint16(i)*cpu.DispWidth/8
		if !cpu.clipQuirk {
			dispOffset = dispOffset % planeSize
		}

		if dispOffset > planeSize {
			break
		}
		erases = erases || (cpu.Display[dispOffset]&leftPart) != 0
		cpu.Display[dispOffset] ^= leftPart

		dispOffset++
		if dispOffset > planeSize {
			break
		}
		if cpu.clipQuirk && dispOffset%(cpu.DispWidth/8) == 0 {
			continue
		}
		erases = erases || (cpu.Display[dispOffset]&rightPart) != 0
		cpu.Display[dispOffset] ^= rightPart
	}
	cpu.SD = true
	cpu.setFlag(erases)

	if cpu.drawQuirk {
		/**
		 * "First is that I, VX and VY are all altered by this routine, so the
		 * Chip-8 programmer should not expect them to be available for reuse with
		 * their original values. These would have to be explicitly set again."
		 * -- https://laurencescotford.com/chip-8-on-the-cosmac-vip-drawing-sprites/
		 **/
		cpu.i = 0
		cpu.v[x] = 0
		cpu.v[y] = 0
	}

	if n == 0 {
		cpu.bumpSpecType(SCHIP)
	}
}
