import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import {
  COLOR_BLAZING,
  COLOR_FAST,
  COLOR_MEDIUM,
  COLOR_SLOW,
  STATUS_KEY,
  TPS_THRESHOLD_BLAZING,
  TPS_THRESHOLD_FAST,
  TPS_THRESHOLD_MEDIUM,
  TPS_THRESHOLD_SLOW,
} from "./constants";

export interface TokenSpeedConfig {
  tpsSlow: number;
  tpsMedium: number;
  tpsFast: number;
  tpsBlazing: number;
  colorSlow: string;
  colorMedium: string;
  colorFast: string;
  colorBlazing: string;
  display: "tps" | "full";
}

/**
 * Validates that TPS thresholds are in ascending order.
 * @returns true if tpsSlow < tpsMedium < tpsFast < tpsBlazing
 */
function isValidThresholdOrder(config: Partial<TokenSpeedConfig>): boolean {
  const { tpsSlow, tpsMedium, tpsFast, tpsBlazing } = config;
  if (
    tpsSlow === undefined ||
    tpsMedium === undefined ||
    tpsFast === undefined ||
    tpsBlazing === undefined
  ) {
    return true; // Partial config — defaults will fill gaps
  }
  return tpsSlow < tpsMedium && tpsMedium < tpsFast && tpsFast < tpsBlazing;
}

// Global settings from the user folder
let userSettings: TokenSpeedConfig | null = null;

/**
 * Reads ~/.pi/agent/settings.json and extracts the "STATUS_KEY" key if present.
 * @returns The user settings, or an empty object if not found
 */
function readUserSettings(
  onWarning?: (message: string) => void,
): TokenSpeedConfig {
  const emptyResponse = {} as TokenSpeedConfig;

  try {
    const settingsPath = join(homedir(), ".pi", "agent", "settings.json");
    const raw = readFileSync(settingsPath, "utf-8");
    const settings = JSON.parse(raw) as Record<string, unknown>;
    const tokenSpeed = settings[STATUS_KEY] as TokenSpeedConfig | undefined;

    if (!tokenSpeed) return emptyResponse;

    if (!isValidThresholdOrder(tokenSpeed)) {
      const { tpsSlow, tpsMedium, tpsFast, tpsBlazing } = tokenSpeed;
      const message = [
        "[pi-token-speed] TPS thresholds must be in ascending order.",
        `Found: ${tpsSlow} < ${tpsMedium} < ${tpsFast} < ${tpsBlazing}. `,
        "Falling back to defaults.",
      ].join("\n");
      onWarning?.(message);

      return emptyResponse;
    }

    return tokenSpeed;
  } catch {
    // File doesn't exist, invalid JSON, or permission error
    return emptyResponse;
  }
}

/**
 * Resolves the final config, merging user settings from ~/.pi/agent/settings.json
 * with the built-in constants as fallbacks.
 * @param onWarning Optional callback for config warnings (e.g. invalid thresholds)
 */
export function getConfig(
  onWarning?: (message: string) => void,
): TokenSpeedConfig {
  userSettings ??= readUserSettings(onWarning);

  const response = {
    tpsSlow: userSettings.tpsSlow ?? TPS_THRESHOLD_SLOW,
    tpsMedium: userSettings.tpsMedium ?? TPS_THRESHOLD_MEDIUM,
    tpsFast: userSettings.tpsFast ?? TPS_THRESHOLD_FAST,
    tpsBlazing: userSettings.tpsBlazing ?? TPS_THRESHOLD_BLAZING,
    colorSlow: userSettings.colorSlow ?? COLOR_SLOW,
    colorMedium: userSettings.colorMedium ?? COLOR_MEDIUM,
    colorFast: userSettings.colorFast ?? COLOR_FAST,
    colorBlazing: userSettings.colorBlazing ?? COLOR_BLAZING,
    display: ["tps", "full"].includes(userSettings.display)
      ? userSettings.display
      : "tps",
  };

  return response;
}
