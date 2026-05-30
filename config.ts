import {
  COLOR_BLAZING,
  COLOR_FAST,
  COLOR_MEDIUM,
  COLOR_SLOW,
  TPS_THRESHOLD_BLAZING,
  TPS_THRESHOLD_FAST,
  TPS_THRESHOLD_MEDIUM,
  TPS_THRESHOLD_SLOW,
} from "./constants";
import { TokenSpeedConfig } from "./interfaces";
import { readUserSettings, writeUserSettings } from "./settings";
import { isValidColorDefinition, isValidThresholdOrder } from "./validation";

/**
 * Cached settings
 */
let userSettings: TokenSpeedConfig | null = null;
let config: TokenSpeedConfig | null = null;

/**
 * Retrieves the default configuration object.
 */
const getDefaultConfig = (): TokenSpeedConfig => {
  return {
    tpsSlow: TPS_THRESHOLD_SLOW,
    tpsMedium: TPS_THRESHOLD_MEDIUM,
    tpsFast: TPS_THRESHOLD_FAST,
    tpsBlazing: TPS_THRESHOLD_BLAZING,
    colorSlow: COLOR_SLOW,
    colorMedium: COLOR_MEDIUM,
    colorFast: COLOR_FAST,
    colorBlazing: COLOR_BLAZING,
    display: "tps",
  };
};

/**
 * Resolves the final config, merging user settings from ~/.pi/agent/settings.json
 * with the built-in constants as fallbacks.
 */
export const getConfig = (): {
  config: TokenSpeedConfig;
  errors: Array<string>;
} => {
  const errors: string[] = [];
  if (config) return { config, errors };

  const defaultSettings = getDefaultConfig();
  userSettings ??= readUserSettings();

  const merged = { ...defaultSettings, ...userSettings };

  // Validate thresholds
  if (!isValidThresholdOrder(merged)) {
    errors.push("");
    errors.push("[pi-token-speed] TPS thresholds must be in ascending order.");
    errors.push(
      `Found: ${merged.tpsSlow} < ${merged.tpsMedium} < ${merged.tpsFast} < ${merged.tpsBlazing}. `,
    );
  }

  // Validate colors
  if (!isValidColorDefinition(merged)) {
    errors.push("");
    errors.push(
      "[pi-token-speed] Colors must be valid 24-bit truecolor ANSI hex strings (e.g., '#00ff88').",
      `Found: ${merged.colorSlow} | ${merged.colorMedium} | ${merged.colorFast} | ${merged.colorBlazing}.`,
    );
  }

  // Validate display
  if (!["tps", "full"].includes(merged.display)) {
    merged.display = "tps";
  }

  config = { ...merged };
  return { config, errors };
};

/**
 * Writes a partial TokenSpeedConfig, invalidating the cache.
 */
export const setConfig = (partial: Partial<TokenSpeedConfig>): void => {
  writeUserSettings(partial);
  resetConfigCache();
};

/**
 * Resets the cached config, forcing a fresh read from disk on the next call.
 */
export const resetConfigCache = (): void => {
  config = null;
  userSettings = null;
};
