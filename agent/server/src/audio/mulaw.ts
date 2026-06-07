/**
 * G.711 μ-law → 16-bit linear PCM.
 *
 * Twilio Media Streams send 8 kHz μ-law audio (`audio/x-mulaw`), but Sarvam's
 * streaming STT wants linear PCM (`pcm_s16le`). We decode each μ-law byte into
 * a signed 16-bit sample using a precomputed 256-entry lookup table (fast — one
 * array read per byte instead of bit-twiddling on every frame).
 */

const MULAW_BIAS = 0x84; // 132
const MULAW_DECODE_TABLE = buildDecodeTable();

function decodeSample(muLawByte: number): number {
  // Standard G.711 μ-law decode.
  const u = ~muLawByte & 0xff;
  const sign = u & 0x80;
  const exponent = (u >> 4) & 0x07;
  const mantissa = u & 0x0f;
  let sample = ((mantissa << 3) + MULAW_BIAS) << exponent;
  sample -= MULAW_BIAS;
  return sign ? -sample : sample;
}

function buildDecodeTable(): Int16Array {
  const table = new Int16Array(256);
  for (let i = 0; i < 256; i++) {
    table[i] = decodeSample(i);
  }
  return table;
}

/**
 * Decode a buffer of μ-law bytes into little-endian 16-bit PCM.
 * One μ-law byte (1 sample) → two PCM bytes, so output is 2× the input length.
 */
export function muLawToPcm16(muLaw: Buffer): Buffer {
  const pcm = Buffer.allocUnsafe(muLaw.length * 2);
  for (let i = 0; i < muLaw.length; i++) {
    pcm.writeInt16LE(MULAW_DECODE_TABLE[muLaw[i]]!, i * 2);
  }
  return pcm;
}
