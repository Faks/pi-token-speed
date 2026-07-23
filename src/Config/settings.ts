import { getAgentDir } from '@earendil-works/pi-coding-agent'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { Validator } from '../Console/Commands/validation.js'
import type { TokenSpeedConfig } from '../Contracts/config-types.js'
import { DefaultDisplay, SlidingWindow, STATUS_KEY, TpsColor, TpsThreshold } from './app.js'

/**
 * Manages TokenSpeed configuration: defaults, user settings, caching,
 * and persistence to ~/.pi/agent/settings.json.
 *
 * Factory function creates isolated instances for testability.
 */
export class Settings {
  cachedConfig: TokenSpeedConfig | null = null
  errors: string[] = []

  readonly settingsPath: string

  constructor(settingsPath: string) {
    this.settingsPath = settingsPath
  }

  /**
   * Creates a Settings instance with the default path.
   */
  static create(): Settings {
    return new Settings(join(getAgentDir(), 'settings.json'))
  }

  /**
   * Retrieves the default configuration object.
   *
   * @returns The default configuration.
   */
  getDefaultConfig(): TokenSpeedConfig {
    return {
      tpsSlow: TpsThreshold.Slow,
      tpsMedium: TpsThreshold.Medium,
      tpsFast: TpsThreshold.Fast,
      tpsBlazing: TpsThreshold.Blazing,
      colorSlow: TpsColor.Slow,
      colorMedium: TpsColor.Medium,
      colorFast: TpsColor.Fast,
      colorBlazing: TpsColor.Blazing,
      slidingWindow: SlidingWindow.Default,
      display: DefaultDisplay.Mode,
      useProviderTokens: DefaultDisplay.UseProviderTokens,
      countStrategy: DefaultDisplay.CountStrategy,
      endTpsBehavior: DefaultDisplay.EndTpsBehavior
    }
  }

  /**
   * Initializes the config values and returns the resolved configuration.
   */
  async initialize(): Promise<TokenSpeedConfig> {
    const defaults = this.getDefaultConfig()
    const userSettings = await this.readUserSettings()

    const merged = { ...defaults, ...userSettings }
    const { config, errors } = new Validator().validate(merged)
    this.cachedConfig = config
    this.errors = errors

    return this.cachedConfig
  }

  /**
   * Returns the cached configuration, or defaults if not yet initialized.
   */
  getConfig(): TokenSpeedConfig {
    return this.cachedConfig || this.getDefaultConfig()
  }

  /**
   * Writes a partial TokenSpeedConfig and updates the cache.
   */
  async setConfig(partial: Partial<TokenSpeedConfig>): Promise<void> {
    await this.writeUserSettings(partial)
    const current = this.cachedConfig || this.getDefaultConfig()
    this.cachedConfig = { ...current, ...partial }
  }

  /**
   * Reads and parses the settings file, returning an empty object on failure.
   */
  async readSettings(): Promise<Record<string, unknown>> {
    try {
      const raw = await readFile(this.settingsPath, 'utf-8')
      return JSON.parse(raw) as Record<string, unknown>
    } catch {
      return {}
    }
  }

  /**
   * Writes a JSON object to the settings file with 2-space indentation.
   */
  async writeSettings(data: Record<string, unknown>): Promise<void> {
    await writeFile(this.settingsPath, JSON.stringify(data, null, 2), 'utf-8')
  }

  /**
   * Reads ~/.pi/agent/settings.json and extracts the "tokenSpeed" settings block.
   *
   * @returns The TokenSpeed settings object.
   */
  async readUserSettings(): Promise<TokenSpeedConfig> {
    const settings = await this.readSettings()
    return (settings[STATUS_KEY] || {}) as TokenSpeedConfig
  }

  /**
   * Writes a partial TokenSpeedConfig to ~/.pi/agent/settings.json,
   * merging it with existing values.
   *
   * @param partial The partial TokenSpeedConfig to write.
   */
  async writeUserSettings(partial: Partial<TokenSpeedConfig>): Promise<void> {
    const settings = await this.readSettings()
    const current = (settings[STATUS_KEY] as Record<string, unknown>) || {}
    settings[STATUS_KEY] = { ...current, ...partial }

    await this.writeSettings(settings)
  }
}

/**
 * Shared singleton instance used across the extension.
 * Created via factory for consistency.
 */
export const settings = Settings.create()
