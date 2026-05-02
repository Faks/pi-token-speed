import type { ExtensionContext } from "@mariozechner/pi-coding-agent";

import { getConfig } from "./config";
import { STATUS_KEY } from "./constants";

/**
 * Applies a custom hex color using 24-bit truecolor ANSI escape codes.
 *
 * @param text The text to colorize
 * @param hex The hex color string, e.g. "#abcdef"
 * @returns The colored text, or the original text if hex is invalid
 */
const colorHex = (text: string, hex: string): string => {
  if (!hex || hex.length !== 7) return text;

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`;
};

/**
 * Maps TPS value to a hex color string, or "" for no color
 * @param tps The TPS value to colorize
 * @returns The hex color string
 */
const getColor = (tps: number | null): string => {
  const config = getConfig();
  if (tps == null) return "";

  if (tps < config.tpsSlow) return config.colorSlow;
  if (tps < config.tpsMedium) return config.colorMedium;
  if (tps < config.tpsFast) return config.colorFast;

  return config.colorBlazing;
};

/**
 * Renders the current TPS value with appropriate color.
 *
 * @param ctx The extension context
 * @param tps The TPS value to render
 * @param tokenCount The number of tokens processed
 * @param elapsedSeconds Elapsed seconds since stream start
 */
export const renderStatus = (
  ctx: ExtensionContext,
  tps: number | null = null,
  tokenCount: number = 0,
  elapsedSeconds: number = 0,
): void => {
  const theme = ctx.ui.theme;
  const value = tps?.toFixed(1);

  const label = theme.fg("dim", "⚡ TPS:");
  const measurement = value ? `${value} tok/s` : "--";

  const color = getColor(tps);
  const display = colorHex(measurement, color);
  const tokens =
    elapsedSeconds > 0
      ? `${tokenCount} tok in ${elapsedSeconds.toFixed(1)}s`
      : `${tokenCount} tok`;

  ctx.ui.setStatus(STATUS_KEY, `${label} ${display} (${tokens})`);
};
