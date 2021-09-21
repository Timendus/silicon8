
// Implemented this one
function mult_unsigned(a,b) {
  let res = 0;
  if ( a < b ) {
    const t = a;
    a = b;
    b = t;
  }
  while(b) {
    if ( b & 1 ) res += a;
    b >>= 1;
    a <<= 1;
  }
  return res;
}

// Implemented this one (bug to fix)
function mult_signed(a,b) {
  const invert = a < 0 ^ b < 0;
  a = Math.abs(a);
  b = Math.abs(b);
  const res = mult_unsigned(a,b);
  if ( invert )
    return -1 * res;
  else
    return res;
}

// Doesn't work in Javascript, but should work fine in CHIP-8
function abs_signed(a) {
  if ( a < 0 )
    return (a ^ 0xFFFF) + 1;
  else
    return a;
}

// This one just subtracts untill it runs out of the input value
function div(n,d) {
  let q = 0;
  let r = n;
  while(r >= d) {
    q++;
    r -= d;
  }
  return [q,r];
}

if D = 0 then error(DivisionByZeroException) end
Q := 0                  -- Initialize quotient and remainder to zero
R := 0
for i := n − 1 .. 0 do  -- Where n is number of bits in N
  R := R << 1           -- Left-shift R by 1 bit
  R(0) := N(i)          -- Set the least-significant bit of R equal to bit i of the numerator
  if R ≥ D then
    R := R − D
    Q(i) := 1
  end
end

// This seems like the fastest option, to implement
function div(n,d) {
  if ( d == 0 ) throw "Can't divide by 0";
  let q = 0;
  let r = 0;
  for ( let i = 0x10000; i > 0; i >>= 1 ) {
    r <<= 1;
    if ( n & i ) r += 1;
    if ( r >= d ) {
      r -= d;
      q |= i;
    }
  }
  return [q,r];
}

div(6,2);
