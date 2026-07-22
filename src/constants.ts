import type {
  CountStrategy,
  DisplayMode,
  EndTpsBehavior,
} from "@pi-token-speed/Interfaces/config-types";

// ── Status Bar ──────────────────────────────────────────────────────
export const STATUS_KEY = "tokenSpeed";

// ── Tools ───────────────────────────────────────────────────────────
export const TOKEN_GENERATION_TOOLS = new Set(["edit", "write"]);

// ── Sliding Window ──────────────────────────────────────────────────
export const COMPACTION_THRESHOLD = 5000;
export const MIN_SLIDING_WINDOW = 100;
export const MAX_SLIDING_WINDOW = 30000;
export const DEFAULT_SLIDING_WINDOW = 1000;

// ── TPS Thresholds ──────────────────────────────────────────────────
export const TPS_THRESHOLD_SLOW = 0;
export const TPS_THRESHOLD_MEDIUM = 15;
export const TPS_THRESHOLD_FAST = 30;
export const TPS_THRESHOLD_BLAZING = 45;

// ── Colors ──────────────────────────────────────────────────────────
export const COLOR_SLOW = "#ff4444";
export const COLOR_MEDIUM = "#ffaa00";
export const COLOR_FAST = "#00ff88";
export const COLOR_BLAZING = "#44ddff";

// ── Defaults ────────────────────────────────────────────────────────
export const DEFAULT_DISPLAY_MODE: DisplayMode = "tps";
export const DEFAULT_USE_PROVIDER_TOKENS = false;
export const DEFAULT_COUNT_STRATEGY: CountStrategy = "direct";
export const DEFAULT_END_TPS_BEHAVIOR: EndTpsBehavior = "average";

// ── Utilities ───────────────────────────────────────────────────────
/** Validates a 24-bit truecolor ANSI hex string. */
export function isValidHex(s: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(s);
}
