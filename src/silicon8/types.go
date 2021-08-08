package silicon8

const AUTO      int = 0
const STRICTVIP int = 1
const VIP       int = 2
const BLINDVIP  int = 3  // To run the emulator in headless VIP mode, which doesn't wait for display refresh
const SCHIP     int = 4
const XOCHIP    int = 5

const STRICTVIP_RAM_SIZE uint16 = 3216 + 512
const VIP_SCHIP_RAM_SIZE uint16 = 3583 + 512
const XOCHIP_RAM_SIZE    uint16 = 65023 + 512
const DEFAULT_STACK_SIZE uint8  = 12
const SCHIP_STACK_SIZE   uint8  = 16  // According to http://devernay.free.fr/hacks/chip8/schip.txt: "Subroutine nesting is limited to 16 levels"

type soundEvent func()
type randomByte func() uint8
type displaySetter func(int, int, int)

type CPU struct {
	// Registers and memory
	RAM        []uint8
	RAMSize    uint16
	Display    []uint8
	DispSize   uint16
	DispWidth  uint16
	DispHeight uint16
	stack      []uint16
	stackSize  uint8
	v          [16]uint8
	userFlags  [8]uint8
	i          uint16
	pc         uint16
	sp         uint8
	dt         uint8
	st         uint8

	// Interpreter internal state
	Keyboard   [16]bool
	waitForKey bool  // Waiting for key press?
	WaitForInt uint8 // Waiting for display refresh "interrupt"?
	playing    bool  // Playing sound?
	SD         bool  // Screen dirty?
	plane      uint8 // XO-Chip: Current drawing plane
	planes     uint8 //          How many planes in total?
	specType   int
	typeFixed  bool
	running    bool

	// Quirks flags
	shiftQuirk bool // Shift result to source register instead of target register
	jumpQuirk  bool // 'jump0' uses v[x] instead of v0 for jump offset
	memQuirk   bool // Load and save opcodes advance i
	vfQuirk    bool // vF is cleared after OR, AND and XOR opcodes
	clipQuirk  bool // Sprites are clipped instead of wrapped at edges of display
	dispQuirk  bool // Halt for display refresh before drawing sprite
	drawQuirk  bool // Draw instruction messes up i, v[x] and v[y]

	// External event handlers
	playSound  soundEvent
	stopSound  soundEvent
	random     randomByte
	setDispRes displaySetter
}
