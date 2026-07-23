import {
  COUNT_STRATEGY_LABELS,
  DefaultDisplay,
  DISPLAY_LABELS,
  END_TPS_BEHAVIOR_LABELS,
  SlidingWindow,
  TpsColor,
  TpsThreshold
} from '../../Config/app.js'
import type { CountStrategy, DisplayMode, EndTpsBehavior, TokenSpeedConfig } from '../../Contracts/config-types.js'

/**
 * Configuration validator for TokenSpeed.
 *
 * Instance-based design for testability and dependency injection.
 */
export class Validator {
  /**
   * Validates the config, correcting invalid values and collecting errors.
   *
   * @param config The configuration to validate
   * @returns The corrected configuration and a list of error messages
   */
  validate(config: TokenSpeedConfig): {
    config: TokenSpeedConfig
    errors: string[]
  } {
    const response = { ...config }
    const errors: string[] = []

    // Correct values with defaults where applicable
    response.display = this.checkDisplayMode(config.display, errors)
    response.countStrategy = this.checkCountStrategy(config.countStrategy, errors)
    response.useProviderTokens = this.checkUseProviderTokens(config.useProviderTokens, errors)
    response.slidingWindow = this.checkSlidingWindow(config.slidingWindow, errors)
    response.endTpsBehavior = this.checkEndTpsBehavior(config.endTpsBehavior, errors)

    // Error-only checks (no correction)
    const thresholdResult = this.isValidThresholdOrder(config)
    if (!thresholdResult.valid) {
      errors.push(...(thresholdResult.errors ?? []))
    }

    const colorResult = this.isValidColorDefinition(config)
    if (!colorResult.valid) {
      errors.push("- Colors must be valid 24-bit truecolor ANSI hex strings (e.g., '#00ff88').")
      errors.push(
        `  Found: ${config.colorSlow} | ${config.colorMedium} | ${config.colorFast} | ${config.colorBlazing}.`
      )
      errors.push(...(colorResult.errors ?? []))
    }

    return { config: response, errors }
  }

  /**
   * Validates that the string is a valid 24-bit truecolor ANSI hex string.
   *
   * @param s The string to validate
   * @returns True if the string is a valid hex color; false otherwise
   */
  isValidHex(s: string): boolean {
    return /^#[0-9a-fA-F]{6}$/u.test(s)
  }

  /**
   * Validates that TPS thresholds are in strict ascending order:
   * tpsSlow < tpsMedium < tpsFast < tpsBlazing.
   *
   * @param config The configuration to validate
   * @returns An object with validity status and optional error messages
   */
  isValidThresholdOrder(config: TokenSpeedConfig): {
    valid: boolean
    errors?: string[]
  } {
    const {
      tpsSlow = TpsThreshold.Slow,
      tpsMedium = TpsThreshold.Medium,
      tpsFast = TpsThreshold.Fast,
      tpsBlazing = TpsThreshold.Blazing
    } = config
    const valid = tpsSlow < tpsMedium && tpsMedium < tpsFast && tpsFast < tpsBlazing
    return {
      valid,
      errors: valid
        ? undefined
        : [
            '- TPS thresholds must be in ascending order.',
            `  Found: ${tpsSlow} < ${tpsMedium} < ${tpsFast} < ${tpsBlazing}.`
          ]
    }
  }

  /**
   * Validates that color definitions are valid 24-bit truecolor ANSI hex strings.
   *
   * @param config The configuration to validate
   * @returns An object with validity status and optional error messages
   */
  isValidColorDefinition(config: TokenSpeedConfig): {
    valid: boolean
    errors?: string[]
  } {
    const {
      colorSlow = TpsColor.Slow,
      colorMedium = TpsColor.Medium,
      colorFast = TpsColor.Fast,
      colorBlazing = TpsColor.Blazing
    } = config
    const errors: string[] = []
    if (!this.isValidHex(colorSlow)) {
      errors.push(`  - Invalid colorSlow: ${colorSlow}`)
    }
    if (!this.isValidHex(colorMedium)) {
      errors.push(`  - Invalid colorMedium: ${colorMedium}`)
    }
    if (!this.isValidHex(colorFast)) {
      errors.push(`  - Invalid colorFast: ${colorFast}`)
    }
    if (!this.isValidHex(colorBlazing)) {
      errors.push(`  - Invalid colorBlazing: ${colorBlazing}`)
    }
    return { valid: errors.length === 0, errors }
  }

  /**
   * Checks that display mode is a recognized value, defaulting if invalid.
   *
   * @param value The display mode value to check.
   * @param errors The shared errors array to push to if invalid.
   * @returns The validated (or defaulted) display mode.
   */
  checkDisplayMode(value: string, errors: string[]): DisplayMode {
    if (Object.keys(DISPLAY_LABELS).includes(value)) {
      return value as DisplayMode
    }

    errors.push(`- Invalid display "${value}" — defaulting to "${DefaultDisplay.Mode}".`)

    return DefaultDisplay.Mode
  }

  /**
   * Checks that countStrategy is a recognized value, defaulting if invalid.
   *
   * @param value The count strategy value to check.
   * @param errors The shared errors array to push to if invalid.
   * @returns The validated (or defaulted) count strategy.
   */
  checkCountStrategy(value: string, errors: string[]): CountStrategy {
    if (Object.keys(COUNT_STRATEGY_LABELS).includes(value)) {
      return value as CountStrategy
    }

    errors.push(`- Invalid countStrategy "${value}" — defaulting to "${DefaultDisplay.CountStrategy}".`)

    return DefaultDisplay.CountStrategy
  }

  /**
   * Checks that useProviderTokens is a boolean, defaulting if invalid.
   *
   * @param value The useProviderTokens value to check.
   * @param errors The shared errors array to push to if invalid.
   * @returns The validated (or defaulted) boolean value.
   */
  checkUseProviderTokens(value: unknown, errors: string[]): boolean {
    if (typeof value === 'boolean') {
      return value
    }

    errors.push(`- Invalid useProviderTokens (expected boolean) — defaulting to ${DefaultDisplay.UseProviderTokens}.`)

    return DefaultDisplay.UseProviderTokens
  }

  /**
   * Checks that sliding window is a reasonable number (between 100ms and 30s),
   * defaulting if invalid.
   *
   * @param value The sliding window value to check.
   * @param errors The shared errors array to push to if invalid.
   * @returns The validated (or defaulted) sliding window value.
   */
  checkSlidingWindow(value: unknown, errors: string[]): number {
    if (typeof value === 'number' && value >= SlidingWindow.Min && value <= SlidingWindow.Max) {
      return value
    }

    errors.push(`- Invalid slidingWindow "${value}" — defaulting to ${SlidingWindow.Default}.`)

    return SlidingWindow.Default
  }

  /**
   * Checks that endTpsBehavior is a recognized value, defaulting if invalid.
   *
   * @param value The endTpsBehavior value to check.
   * @param errors The shared errors array to push to if invalid.
   * @returns The validated (or defaulted) end TPS behavior.
   */
  checkEndTpsBehavior(value: unknown, errors: string[]): EndTpsBehavior {
    if (Object.keys(END_TPS_BEHAVIOR_LABELS).includes(value as string)) {
      return value as EndTpsBehavior
    }

    errors.push(`- Invalid endTpsBehavior "${value}" — defaulting to "${DefaultDisplay.EndTpsBehavior}".`)

    return DefaultDisplay.EndTpsBehavior
  }
}
