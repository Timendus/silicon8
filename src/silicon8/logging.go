// +build !debug

package silicon8

func info(message string, addr, opcode uint16) {
}

func warn(message string, addr, opcode uint16) {
	println(message, "@", addr, ":", opcode)
}
