import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { STATUS_KEY } from "./constants";

import {
  COLOR_BLAZING,
  COLOR_FAST,
  COLOR_MEDIUM,
  COLOR_SLOW,
  TPS_THRESHOLD_FAST,
  TPS_THRESHOLD_MEDIUM,
  TPS_THRESHOLD_SLOW,
} from "./constants";

export interface TokenSpeedConfig {
  tpsSlow: number;
  tpsMedium: number;
  tpsFast: number;
  colorSlow: string;
  colorMedium: string;
  colorFast: string;
  colorBlazing: string;
}

// Global settings from the user folder
let userSettings: TokenSpeedConfig | null = null;

/**
 * Reads ~/.pi/agent/settings.json and extracts the "STATUS_KEY" key if present.
 * @returns The user settings, or an empty object if not found
 */
function readUserSettings(): TokenSpeedConfig {
  try {
    const settingsPath = join(homedir(), ".pi", "agent", "settings.json");
    const raw = readFileSync(settingsPath, "utf-8");
    const settings = JSON.parse(raw) as Record<string, unknown>;
    const tokenSpeed = settings[STATUS_KEY] as TokenSpeedConfig;

    return tokenSpeed ?? {};
  } catch {
    // File doesn't exist, invalid JSON, or permission error
    return {} as TokenSpeedConfig;
  }
}

/**
 * Resolves the final config, merging user settings from ~/.pi/agent/settings.json
 * with the built-in constants as fallbacks.
 */
export function getConfig(): TokenSpeedConfig {
  if (userSettings === null) {
    userSettings = readUserSettings();
  }

  const response = {
    tpsSlow: userSettings.tpsSlow ?? TPS_THRESHOLD_SLOW,
    tpsMedium:userSettings.tpsMedium ?? TPS_THRESHOLD_MEDIUM,
    tpsFast: userSettings.tpsFast ?? TPS_THRESHOLD_FAST,
    colorSlow: userSettings.colorSlow ?? COLOR_SLOW,
    colorMedium: userSettings.colorMedium ?? COLOR_MEDIUM,
    colorFast: userSettings.colorFast ?? COLOR_FAST,
    colorBlazing: userSettings.colorBlazing ?? COLOR_BLAZING,
  };

  return response;
}
