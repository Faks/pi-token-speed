import {
  COLOR_BLAZING,
  COLOR_FAST,
  COLOR_MEDIUM,
  COLOR_SLOW,
  SLIDING_WINDOW,
  TPS_THRESHOLD_BLAZING,
  TPS_THRESHOLD_FAST,
  TPS_THRESHOLD_MEDIUM,
  TPS_THRESHOLD_SLOW,
} from "./constants";
import { TokenSpeedConfig } from "./interfaces";
import { readUserSettings, writeUserSettings } from "./settings";
import {
  isValidColorDefinition,
  isValidCountStrategy,
  isValidSlidingWindow,
  isValidThresholdOrder,
} from "./validation";

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
    display: "tps",
    tpsSlow: TPS_THRESHOLD_SLOW,
    tpsMedium: TPS_THRESHOLD_MEDIUM,
    tpsFast: TPS_THRESHOLD_FAST,
    tpsBlazing: TPS_THRESHOLD_BLAZING,
    colorSlow: COLOR_SLOW,
    colorMedium: COLOR_MEDIUM,
    colorFast: COLOR_FAST,
    colorBlazing: COLOR_BLAZING,
    slidingWindow: SLIDING_WINDOW,
    useProviderTokens: false,
    countStrategy: "direct",
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

  // Validate display (default to tps)
  if (!["tps", "full"].includes(merged.display)) {
    merged.display = "tps";
  }

  // Validate count strategy
  if (!isValidCountStrategy(merged)) {
    merged.countStrategy = "direct";
  }

  // Validate useProviderTokens
  if (typeof merged.useProviderTokens !== "boolean") {
    merged.useProviderTokens = false;
  }

  // Validate sliding window time
  if (!isValidSlidingWindow(merged)) {
    merged.slidingWindow = SLIDING_WINDOW;
  }

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
