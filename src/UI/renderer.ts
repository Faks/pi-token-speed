import type { ExtensionContext } from '@earendil-works/pi-coding-agent'
import {
  HEX_B_END,
  HEX_B_START,
  HEX_G_END,
  HEX_G_START,
  HEX_R_START,
  STATUS_KEY,
  SUFFIX_FORMATS,
  SUFFIX_SEPARATOR,
  ZWSP
} from '../Config/app.js'
import { settings } from '../Config/settings.js'
import type { DisplayMode, TokenSpeedConfig } from '../Contracts/config-types.js'
import type { TokenSpeedEngine } from '../Core/engine.js'
import { isValidHex } from '../Helpers/validators.js'

/**
 * Renderer for the token-speed status bar.
 */
export class Renderer {
  readonly engine: TokenSpeedEngine

  /**
   * Creates a new Renderer bound to an engine.
   */
  constructor(engine: TokenSpeedEngine) {
    this.engine = engine
  }

  /**
   * Applies a custom hex color using 24-bit truecolor ANSI escape codes.
   *
   * @param text The text to colorize
   * @param hex The hex color string, e.g. "#abcdef"
   * @returns The colored text, or the original text if hex is invalid.
   */
  colorHex(text: string, hex: string): string {
    if (!isValidHex(hex)) {
      return text
    }

    const r = Number.parseInt(hex.slice(HEX_R_START, HEX_G_START), 16)
    const g = Number.parseInt(hex.slice(HEX_G_START, HEX_G_END), 16)
    const b = Number.parseInt(hex.slice(HEX_B_START, HEX_B_END), 16)

    return `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`
  }

  /**
   * Maps TPS value to a hex color string, or "" for no color.
   *
   * @param config The resolved configuration
   * @param tps The TPS value to colorize
   * @returns The hex color string, or empty string if no color should be applied.
   */
  getColor(config: TokenSpeedConfig, tps: number | null): string {
    if (tps === null) {
      return ''
    }

    if (tps >= config.tpsBlazing) {
      return config.colorBlazing
    }
    if (tps >= config.tpsFast) {
      return config.colorFast
    }
    if (tps >= config.tpsMedium) {
      return config.colorMedium
    }
    if (tps >= config.tpsSlow) {
      return config.colorSlow
    }

    return ''
  }

  /**
   * Formats the stats portion: "<x> tok in <y>s".
   *
   * @param tokenCount The number of tokens
   * @param elapsedSeconds The elapsed time in seconds
   * @returns The formatted stats string.
   */
  formatStats(tokenCount: number, elapsedSeconds: number): string {
    if (elapsedSeconds <= 0) {
      return `${tokenCount} tok`
    }
    return `${tokenCount} tok in ${elapsedSeconds.toFixed(1)}s`
  }

  /**
   * Builds a suffix for the status bar after the TPS measurement.
   *
   * @param display Display mode to check against
   * @returns The suffix to append
   */
  buildSuffix(display: DisplayMode): string {
    const { ttft, tokenCount: tokens, elapsedSeconds: elapsed } = this.engine
    const format = SUFFIX_FORMATS[display]

    if (format === ZWSP) {
      return ZWSP
    }

    const stats = this.formatStats(tokens, elapsed)
    return format
      .replace('{ttft}', String(ttft))
      .replace('{stats}', stats)
      .replace('{sep}', SUFFIX_SEPARATOR)
      .replace('{zwsp}', ZWSP)
  }

  /**
   * Renders the first-run placeholder in the status bar.
   *
   * @param ctx The context used by Pi.
   */
  initialize(ctx: ExtensionContext): void {
    const { theme } = ctx.ui
    const text = `${theme.fg('dim', '⚡ TPS:')} --`
    ctx.ui.setStatus(STATUS_KEY, text)
  }

  /**
   * Updates the status bar with the given context.
   *
   * @param ctx The context used by Pi.
   */
  update(ctx: ExtensionContext): void {
    const config = settings.getConfig()
    const { theme } = ctx.ui

    // Render TPS first
    const { tps } = this.engine
    const value = tps?.toFixed(1)
    let measurement: string
    if (value) {
      measurement = `${value} tok/s`
    } else {
      measurement = '--'
    }

    const color = this.getColor(config, tps)
    const displayValue = this.colorHex(measurement, color)

    // Build the suffix based on display mode
    const suffix = this.buildSuffix(config.display)
    const text = `${theme.fg('dim', '⚡ TPS:')} ${displayValue}${suffix}`

    ctx.ui.setStatus(STATUS_KEY, text)
  }
}
