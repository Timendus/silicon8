package silicon8

func (cpu *CPU) RegisterSoundCallbacks(playSound playSoundEvent, stopSound stopSoundEvent) {
	cpu.playSound = playSound
	cpu.stopSound = stopSound
}

func (cpu *CPU) RegisterRandomGenerator(random randomByte) {
	cpu.random = random
}

func (cpu *CPU) RegisterDisplayCallback(render renderEvent) {
	cpu.render = render
}
