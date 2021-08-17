package silicon8

func (cpu *CPU) clearScreen() {
  planes := cpu.plane ^ 0xFF
  for i := range cpu.planeBuffer {
    cpu.planeBuffer[i] = cpu.planeBuffer[i] & planes
  }
  cpu.SD = true
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

func (cpu *CPU) draw(x, y, n uint8 ) {
	if cpu.waitForInterrupt() {
		return
	}

	// Get real sprite position & height
	xPos := cpu.v[x]
	yPos := cpu.v[y]
	for xPos >= uint8(cpu.DispWidth) {
		xPos -= uint8(cpu.DispWidth)
	}
	for yPos >= uint8(cpu.DispHeight) {
		yPos -= uint8(cpu.DispHeight)
	}
  height := uint16(n)
  if height == 0 {
    height = 16
  }

	// Do the actual drawing
	erases := false
  ramPointer := cpu.i
  var plane uint8 = 1
	var i uint16

  for plane < 16 {                       // Go through four planes
    if plane & cpu.plane != 0 {          // If this plane is currently selected
      planeBufPointer := uint16(yPos)*cpu.DispWidth + uint16(xPos)
    	for i = 0; i < height; i++ {       // Draw N lines
        lineErases := cpu.drawLine(ramPointer, planeBufPointer, plane)
        erases = erases || lineErases
        ramPointer++
        if n == 0 {
          lineErases := cpu.drawLine(ramPointer, planeBufPointer+8, plane)
          erases = erases || lineErases
          ramPointer++
        }
        planeBufPointer += cpu.DispWidth
      }
    }
    plane = plane << 1
  }

  cpu.SD = true
  cpu.setFlag(erases)
	cpu.messUpRegisters(x, y)
	if n == 0 {
		cpu.bumpSpecType(SCHIP)
	}
}

func (cpu *CPU) waitForInterrupt() bool {
	if !cpu.dispQuirk {
		return false
	}

	switch cpu.WaitForInt {
	case 0:
		cpu.WaitForInt = 1
		cpu.pc -= 2
		return true
	case 1:
		cpu.pc -= 2
		return true
	default:
		cpu.WaitForInt = 0
		return false
	}
}

// Copy eight pixels (one byte) from a location in RAM to the given plane in the
// planeBuffer
func (cpu *CPU) drawLine(ramPointer uint16, planeBufPointer uint16, plane uint8) bool {
  pixels := cpu.RAM[cpu.a(ramPointer)]
  erases := false
  var bit uint8
  for bit = 128; bit > 0; bit = bit >> 1 {
    if pixels & bit != 0 {
      erases = erases || ((cpu.planeBuffer[planeBufPointer]&plane) != 0)
      cpu.planeBuffer[planeBufPointer] ^= plane
    }
    planeBufPointer++
  }
  return erases
}

func (cpu *CPU) messUpRegisters(x, y uint8) {
	if !cpu.drawQuirk {
		return
	}

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

func (cpu *CPU) initDisplay(width uint16, height uint16, planes uint8) {
	cpu.DispWidth = width
	cpu.DispHeight = height
	cpu.planes = planes
}

func (cpu *CPU) renderToDisplayBuffer() {
	var r, g, b uint8
	for i := 0; i < int(cpu.DispHeight * cpu.DispWidth); i++ {
		switch cpu.planeBuffer[i] {

		// Palette zero: four shades of gray
		case 0:
			r = 0x00
			g = 0x00
			b = 0x00
		case 1:
			r = 0xFF
			g = 0xFF
			b = 0xFF
		case 2:
			r = 0xAA
			g = 0xAA
			b = 0xAA
		case 3:
			r = 0x55
			g = 0x55
			b = 0x55

		// Palette one: red, green, blue, yellow
		case 4:
			r = 0xFF
			g = 0x00
			b = 0x00
		case 5:
			r = 0x00
			g = 0xFF
			b = 0x00
		case 6:
			r = 0x00
			g = 0x00
			b = 0xFF
		case 7:
			r = 0xFF
			g = 0xFF
			b = 0x00

		// Palette two: bordeaux, dark green, navy, orange
		case 8:
			r = 0x88
			g = 0x00
			b = 0x00
		case 9:
			r = 0x00
			g = 0x88
			b = 0x00
		case 10:
			r = 0x00
			g = 0x00
			b = 0x88
		case 11:
			r = 0x88
			g = 0x88
			b = 0x00

		// Palette three: pink and cyan, purple and ocean
		case 12:
			r = 0xFF
			g = 0x00
			b = 0xFF
		case 13:
			r = 0x00
			g = 0xFF
			b = 0xFF
		case 14:
			r = 0x88
			g = 0x00
			b = 0x88
		case 15:
			r = 0x00
			g = 0x88
			b = 0x88

		}
		dispBufOffset := i * 3
		cpu.Display[dispBufOffset+0] = r
		cpu.Display[dispBufOffset+1] = g
		cpu.Display[dispBufOffset+2] = b
	}
}
