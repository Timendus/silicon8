package silicon8

/*
 TODO:
  * SCHIP opcodes
    * 16x16 sprites
  * XO-CHIP opcodes
    * plane n (opcode works, but draw routine only draws to plane 1)
*/

import "time"

const VIP       int = 0
const STRICTVIP int = 1
const SCHIP     int = 2
const XOCHIP    int = 3
const BLINDVIP  int = 4  // To run the emulator in headless VIP mode, which doesn't wait for display refresh

type soundEvent func()
type randomByte func() uint8
type displaySetter func(int, int, int)

type CPU struct {
  RAM        []uint8
  RAMSize    uint16
  Display    []uint8
  DispSize   uint16
  DispWidth  uint16
  DispHeight uint16
  Stack      []uint16
  StackSize  uint8
  v          [16]uint8
  userFlags  [8]uint8
  i          uint16
  pc         uint16
  sp         uint8
  dt         uint8
  st         uint8

  Keyboard   [16]bool
  waitForKey bool  // Waiting for key press?
  WaitForInt uint8 // Waiting for display refresh "interrupt"?
  playing    bool  // Playing sound?
  SD         bool  // Screen dirty?
  plane      uint8 // XO-Chip: Current drawing plane
  planes     uint8 //          How many planes in total?

  shiftQuirk bool  // Shift result to source register instead of target register
  jumpQuirk  bool  // 'jump0' uses v[x] instead of v0 for jump offset
  memQuirk   bool  // Load and save opcodes advance i
  vfQuirk    bool  // vF is cleared after OR, AND and XOR opcodes
  clipQuirk  bool  // Sprites are clipped instead of wrapped at edges of display
  dispQuirk  bool  // Halt for display refresh before drawing sprite
  drawQuirk  bool  // Draw instruction messes up i, v[x] and v[y]

  playSound  soundEvent
  stopSound  soundEvent
  random     randomByte
  setDispRes displaySetter

  running    bool
}

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
  switch(interpreter) {
  case STRICTVIP:
    cpu.RAMSize = 3216 + 512
    cpu.StackSize = 12
  case VIP, BLINDVIP:
    cpu.RAMSize = 3583 + 512
    cpu.StackSize = 12
  case SCHIP:
    cpu.RAMSize = 3583 + 512
    cpu.StackSize = 16 // According to http://devernay.free.fr/hacks/chip8/schip.txt: "Subroutine nesting is limited to 16 levels"
  case XOCHIP:
    cpu.RAMSize = 65023 + 512
    cpu.StackSize = 12
  }

  // Initialize registers
  cpu.pc = 0x0200
  cpu.sp = cpu.StackSize - 1
  cpu.dt = 0
  cpu.st = 0

  // Initialize memory
  cpu.initDisplay(64, 32, 1)
  cpu.RAM = make([]uint8, cpu.RAMSize)
  cpu.Stack = make([]uint16, cpu.StackSize)

  // Initialize internal variables
  for i := range cpu.Keyboard { cpu.Keyboard[i] = false }
  cpu.waitForKey = false
  cpu.WaitForInt = 0
  cpu.playing    = false
  cpu.SD         = true
  cpu.running    = true
  cpu.plane      = 1
  cpu.planes     = 1

  // Determine quirks to use
  cpu.shiftQuirk = interpreter == SCHIP
  cpu.jumpQuirk  = interpreter == SCHIP
  cpu.memQuirk   = interpreter != SCHIP
  cpu.vfQuirk    = interpreter == VIP || interpreter == STRICTVIP || interpreter == BLINDVIP
  cpu.clipQuirk  = interpreter != XOCHIP
  cpu.dispQuirk  = interpreter == VIP || interpreter == STRICTVIP
  cpu.drawQuirk  = interpreter == STRICTVIP
}

func (cpu *CPU) RegisterSoundCallbacks(playSound soundEvent, stopSound soundEvent) {
  cpu.playSound = playSound
  cpu.stopSound = stopSound
}

func (cpu *CPU) RegisterRandomGenerator(random randomByte) {
  cpu.random = random
}

func (cpu *CPU) RegisterDisplayCallback(setDisplaySize displaySetter) {
  cpu.setDispRes = setDisplaySize
}

func (cpu *CPU) initDisplay(width uint16, height uint16, planes uint8) {
  cpu.DispWidth = width
  cpu.DispHeight = height
  cpu.planes = planes
  cpu.DispSize = cpu.DispWidth * cpu.DispHeight / 8 * uint16(planes)
  cpu.Display = make([]uint8, cpu.DispSize)

  // Update outside world too
  if ( cpu.setDispRes != nil ) {
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

func (cpu *CPU) A(address uint16) uint16 {
  if address >= 0 && int(address) < len(cpu.RAM) {
    return address
  } else {
    opcodeAddr := cpu.pc - 2
    var opcode uint16 = 0
    if opcodeAddr >= 0 && int(opcodeAddr) < len(cpu.RAM) {
      opcode = uint16(cpu.RAM[opcodeAddr]) << 8 | uint16(cpu.RAM[opcodeAddr+1])
    }
    warn("Program attempted to access RAM outside of memory", opcodeAddr, opcode)
    cpu.DumpStatus()
    cpu.running = false;
    return 0
  }
}

func (cpu *CPU) Step() {
  if !cpu.running {
    return
  }

  var op  uint16 = uint16(cpu.RAM[cpu.A(cpu.pc)]) << 8 | uint16(cpu.RAM[cpu.A(cpu.pc+1)])
  var x   uint8  = cpu.RAM[cpu.A(cpu.pc)]   & 0x0F
  var y   uint8  = cpu.RAM[cpu.A(cpu.pc+1)] & 0xF0 >> 4
  var n   uint8  = cpu.RAM[cpu.A(cpu.pc+1)] & 0x0F
  var nn  uint8  = cpu.RAM[cpu.A(cpu.pc+1)] & 0xFF
  var nnn uint16 = uint16(x) << 8 | uint16(nn)

  info("Processing instruction", cpu.pc, op)
  cpu.pc += 2

  switch(op & 0xF000) {
  case 0x0000:
    cpu.machineCall(op, n)
  case 0x1000:
    cpu.pc = nnn
  case 0x2000:
    cpu.Stack[cpu.sp] = cpu.pc
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
    if (x > y) {
      n := x
      x = y
      y = n
    }

    switch(n) {
    case 2:
      for i := x; i <= y; i++ {
        cpu.RAM[cpu.A(cpu.i + uint16(i - x))] = cpu.v[i]
      }
    case 3:
      for i := x; i <= y; i++ {
        cpu.v[i] = cpu.RAM[cpu.A(cpu.i + uint16(i - x))]
      }
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
    switch(nn) {
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

    switch(nn) {
    case 0x00:
      cpu.pc += 2
      cpu.i = uint16(cpu.RAM[cpu.A(cpu.pc)]) << 8 | uint16(cpu.RAM[cpu.A(cpu.pc+1)])
    case 0x01:
      // Enable the second plane if it hasn't been enabled yet
      if cpu.planes == 1 {
        cpu.initDisplay(cpu.DispWidth, cpu.DispHeight, 2)
      }
      // Select plane X
      cpu.plane = x
    case 0x02:
      // Load 16 bytes of audio buffer from (i)
      // (No-op in our implementation, at least for now)
    case 0x07:
      cpu.v[x] = cpu.dt
    case 0x0A:
      cpu.getkey(x)
    case 0x15:
      cpu.dt = cpu.v[x]
    case 0x18:
      cpu.st = cpu.v[x]
    case 0x1E:
      cpu.i += uint16(cpu.v[x])
    case 0x29:
      cpu.i = uint16(cpu.v[x] * 5)
    case 0x30:
      cpu.i = uint16(cpu.v[x] * 10) + 80
    case 0x33:
      cpu.RAM[cpu.A(cpu.i + 0)] = cpu.v[x] / 100
      cpu.RAM[cpu.A(cpu.i + 1)] = cpu.v[x] % 100 / 10
      cpu.RAM[cpu.A(cpu.i + 2)] = cpu.v[x] % 10
    case 0x55:
      var i uint8
      for i = 0; i <= x; i++ {
        cpu.RAM[cpu.A(cpu.i + uint16(i))] = cpu.v[i]
      }
      if cpu.memQuirk {
        cpu.i += uint16(x) + 1
      }
    case 0x65:
      var i uint8
      for i = 0; i <= x; i++ {
        cpu.v[i] = cpu.RAM[cpu.A(cpu.i + uint16(i))]
      }
      if cpu.memQuirk {
        cpu.i += uint16(x) + 1
      }
    case 0x75:
      var i uint8
      for i = 0; i <= x; i++ {
        cpu.userFlags[i] = cpu.v[i]
      }
    case 0x85:
      var i uint8
      for i = 0; i <= x; i++ {
        cpu.v[i] = cpu.userFlags[i]
      }
    }

  }
}

func (cpu *CPU) machineCall(op uint16, n uint8) {
  switch(op & 0xFFF0) {
  case 0x00C0:
    cpu.scrollDown(n)
    return
  case 0x00D0:
    cpu.scrollUp(n)
    return
  }

  switch(op) {
  case 0x00E0:
    // Clear screen
    for i := range cpu.Display { cpu.Display[i] = 0 }
    cpu.SD = true
  case 0x00EE:
    // Return
    cpu.sp++
    cpu.pc = cpu.Stack[cpu.sp]
  case 0x00FB:
    cpu.scrollRight()
  case 0x00FC:
    cpu.scrollLeft()
  case 0x00FD:
    // "Exit" interpreter. Will just halt in our implementation
    cpu.running = false
  case 0x00FE:
    // Set normal screen resolution
    cpu.initDisplay(64, 32, cpu.planes)
  case 0x00FF:
    // Set extended screen resolution
    cpu.initDisplay(128, 64, cpu.planes)
  default:
    warn("RCA 1802 assembly calls not supported", cpu.pc - 2, op)
  }
}

func (cpu *CPU) scrollDown(n uint8) {
  for i := 8 * (32 - n); i > 8 * n; i-- {
    cpu.Display[i + 8 * n] = cpu.Display[i]
  }
}

func (cpu *CPU) scrollUp(n uint8) {
  for i := 8 * n; i < 8 * (32 - n); i++ {
    cpu.Display[i - 8 * n] = cpu.Display[i]
  }
}

func (cpu *CPU) scrollLeft() {
  for y := 0; y < 32; y++ {
    for x := 0; x < 7; x++ {
      i := y * 32 + x
      cpu.Display[i] = cpu.Display[i] << 4 | cpu.Display[i+1] >> 4
    }
    i := y * 32 + 7
    cpu.Display[i] = cpu.Display[i] << 4
  }
}

func (cpu *CPU) scrollRight() {
  for y := 0; y < 32; y++ {
    for x := 7; x > 0; x-- {
      i := y * 32 + x
      cpu.Display[i] = cpu.Display[i] >> 4 | cpu.Display[i-1] << 4
    }
    i := y * 32
    cpu.Display[i] = cpu.Display[i] >> 4
  }
}

func (cpu *CPU) maths(x, y, n uint8) {
  switch(n) {
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
    flag := cpu.v[y] & 0b00000001 > 0
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
    flag := cpu.v[y] & 0b10000000 > 0
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
    switch(cpu.WaitForInt) {
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
  for xPos >= uint8(cpu.DispWidth)  {
    xPos -= uint8(cpu.DispWidth)
  }
  for yPos >= uint8(cpu.DispHeight) {
    yPos -= uint8(cpu.DispHeight)
  }
  topLeftOffset := uint16(yPos) * cpu.DispWidth / 8 + uint16(xPos) / 8
  erases := false
  planeSize := cpu.DispSize / uint16(cpu.planes)
  var i uint8
  for i = 0; i < n; i++ {
    sprite := cpu.RAM[cpu.A(cpu.i + uint16(i))]
    leftPart := sprite >> (xPos % 8)
    rightPart := sprite << (8 - (xPos % 8))
    dispOffset := uint16(topLeftOffset) + uint16(i) * cpu.DispWidth / 8
    if !cpu.clipQuirk { dispOffset = dispOffset % planeSize }

    if dispOffset > planeSize { break }
    erases = erases || (cpu.Display[dispOffset] & leftPart) != 0
    cpu.Display[dispOffset] ^= leftPart

    dispOffset++
    if dispOffset > planeSize { break }
    if cpu.clipQuirk && dispOffset % (cpu.DispWidth / 8) == 0 { continue }
    erases = erases || (cpu.Display[dispOffset] & rightPart) != 0
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
}

func (cpu *CPU) getkey(x uint8) {
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
      if p { return }
    }
    cpu.waitForKey = true
  }
}
