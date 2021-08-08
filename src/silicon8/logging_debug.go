// +build debug

package silicon8

import "fmt"

func info(message string, addr, opcode uint16) {
	log(message, addr, opcode)
}

func warn(message string, addr, opcode uint16) {
	log(message, addr, opcode)
}

func log(message string, addr, opcode uint16) {
	println(fmt.Sprintf("%s @ %04X : %04X", message, addr, opcode))
}
