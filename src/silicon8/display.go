package silicon8

func (cpu *CPU) clearScreen() {
  cpu.clearPlanes(cpu.plane ^ 0xFF)
}

func (cpu *CPU) clearPlanes(planes uint8) {
  for i := range cpu.planeBuffer {
    cpu.planeBuffer[i] = cpu.planeBuffer[i] & planes
  }
  cpu.SD = true
}

func (cpu *CPU) scrollDown(n uint8) {
  offset := cpu.DispWidth * uint16(n)
  for i := cpu.DispWidth * cpu.DispHeight; i > 0; i-- {
    j := i - 1
    var pixel uint8
    if j > offset {
      pixel = cpu.planeBuffer[j - offset] & cpu.plane
    } else {
      pixel = 0
    }
    cpu.planeBuffer[j] = cpu.planeBuffer[j] & (cpu.plane ^ 0xFF) | pixel
  }
  cpu.SD = true
}

func (cpu *CPU) scrollUp(n uint8) {
  offset := cpu.DispWidth * uint16(n)
  for i := uint16(0); i < cpu.DispWidth * cpu.DispHeight; i++ {
    var pixel uint8
    if i + offset < cpu.DispWidth * cpu.DispHeight {
      pixel = cpu.planeBuffer[i + offset] & cpu.plane
    } else {
      pixel = 0
    }
    cpu.planeBuffer[i] = cpu.planeBuffer[i] & (cpu.plane ^ 0xFF) | pixel
  }
  cpu.SD = true
}

func (cpu *CPU) scrollLeft() {
  for i := uint16(0); i < cpu.DispWidth * cpu.DispHeight; i++ {
    var pixel uint8
    if i % cpu.DispWidth < cpu.DispWidth - 4 {
      pixel = cpu.planeBuffer[i + 4] & cpu.plane
    } else {
      pixel = 0
    }
    cpu.planeBuffer[i] = cpu.planeBuffer[i] & (cpu.plane ^ 0xFF) | pixel
  }
  cpu.SD = true
}

func (cpu *CPU) scrollRight() {
  for i := cpu.DispWidth * cpu.DispHeight; i > 0; i-- {
    j := i - 1
    var pixel uint8
    if j % cpu.DispWidth >= 4 {
      pixel = cpu.planeBuffer[j - 4] & cpu.plane
    } else {
      pixel = 0
    }
    cpu.planeBuffer[j] = cpu.planeBuffer[j] & (cpu.plane ^ 0xFF) | pixel
  }
  cpu.SD = true
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
        // Does this line fall off the bottom of the screen?
        if planeBufPointer > cpu.DispWidth * cpu.DispHeight {
          if cpu.clipQuirk {
            continue
          } else {
            planeBufPointer -= cpu.DispWidth * cpu.DispHeight
          }
        }
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
    // Did we cross the edge of the screen?
    if planeBufPointer % cpu.DispWidth == 0 {
      if cpu.clipQuirk {
        break
      } else {
        planeBufPointer -= cpu.DispWidth
      }
    }
  }
  return erases
}

func (cpu *CPU) initDisplay(width uint16, height uint16, planes uint8) {
	cpu.DispWidth = width
	cpu.DispHeight = height
	cpu.planes = planes
}

func (cpu *CPU) RenderToDisplayBuffer() {
	var colour uint8
	for i := 0; i < int(cpu.DispHeight * cpu.DispWidth); i++ {
    colour = cpu.palette[cpu.planeBuffer[i]]
		dispBufOffset := i * 3
		cpu.Display[dispBufOffset+0] = (colour >> 5) * (255 / 7)
		cpu.Display[dispBufOffset+1] = (colour >> 2 & 7) * (255 / 7)
		cpu.Display[dispBufOffset+2] = (colour & 3) * (255 / 3)
	}
}
