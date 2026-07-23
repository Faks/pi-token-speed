import { HEX_REGEX } from '../Enums/hex.js'

/** Validates a 24-bit truecolor ANSI hex string. */
export function isValidHex(s: string): boolean {
  return HEX_REGEX.test(s)
}
