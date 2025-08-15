package silicon8

// There are probably more fancy ways to do this, but passing all addresses
// through these functions to see if they are valid works too ;)

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
	if int(opcodeAddr) < len(cpu.RAM) {
		opcode = uint16(cpu.RAM[opcodeAddr])<<8 | uint16(cpu.RAM[opcodeAddr+1])
	}
	warn(msg, opcodeAddr, opcode)
}
