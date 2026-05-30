import { getAgentDir } from "@earendil-works/pi-coding-agent";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { STATUS_KEY } from "./constants";
import { TokenSpeedConfig } from "./interfaces";

/**
 * Reads ~/.pi/agent/settings.json and returns the full settings object.
 */
const readFullSettings = (): Record<string, unknown> => {
  try {
    const settingsPath = join(getAgentDir(), "settings.json");
    const raw = readFileSync(settingsPath, "utf-8");
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
};

/**
 * Writes the full settings object to ~/.pi/agent/settings.json.
 */
const writeFullSettings = (settings: Record<string, unknown>): void => {
  const settingsPath = join(getAgentDir(), "settings.json");
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
};

/**
 * Reads ~/.pi/agent/settings.json and extracts the "tokenSpeed" settings block.
 */
export const readUserSettings = (): TokenSpeedConfig => {
  const settings = readFullSettings();
  return (settings[STATUS_KEY] || {}) as TokenSpeedConfig;
};

/**
 * Writes a partial TokenSpeedConfig to ~/.pi/agent/settings.json,
 * merging it with existing values.
 */
export const writeUserSettings = (partial: Partial<TokenSpeedConfig>): void => {
  const settings = readFullSettings();
  const current = (settings[STATUS_KEY] as Record<string, unknown>) || {};
  settings[STATUS_KEY] = { ...current, ...partial };

  writeFullSettings(settings);
};
