import type { CountStrategy, DisplayMode, EndTpsBehavior } from '../Contracts/config-types.js'

/** Zero-width space for status bar layout. */
export const ZWSP = '\u200b'

/** Middle dot separator for combined suffix display. */
export const SUFFIX_SEPARATOR = '\u00b7'

/** Suffix format patterns for each display mode. */
export const SUFFIX_FORMATS: Record<DisplayMode, string> = {
  tps: ZWSP,
  ttft: ` (TTFT: {ttft} ms){zwsp}`,
  stats: ` ({stats}){zwsp}`,
  full: ` ({stats} {sep} TTFT: {ttft} ms){zwsp}`
}

/** Application-level constants. */
export const STATUS_KEY = 'tokenSpeed'

/** Tools that generate tokens. */
export const TOKEN_GENERATION_TOOLS = new Set(['edit', 'write'])

/** Events compaction threshold. */
export const COMPACTION_THRESHOLD = 5000

/**
 * Human-readable labels for display mode values.
 */
export const DISPLAY_LABELS: Record<DisplayMode, string> = {
  tps: 'TPS speed',
  ttft: 'TTFT only',
  stats: 'Token stats',
  full: 'Full details'
}

/**
 * Human-readable labels for count strategy values.
 */
export const COUNT_STRATEGY_LABELS: Record<CountStrategy, string> = {
  estimate: 'Estimate (fast)',
  direct: 'Direct (accurate)'
}

/**
 * Human-readable labels for end TPS behavior values.
 */
export const END_TPS_BEHAVIOR_LABELS: Record<EndTpsBehavior, string> = {
  average: 'Average (overall)',
  last: 'Last (sliding window)'
}

/**
 * Human-readable labels for boolean toggle values.
 */
export const TOGGLE_LABELS: Record<'on' | 'off', string> = {
  on: 'On',
  off: 'Off'
}

/** Milliseconds per second, used for elapsed time conversion. */
export const MS_PER_SECOND = 1000

/** Regex for token estimation in text. */
export const TOKEN_REGEX = /\w+|[^\s\w]/gu

/** Hex color channel slice indices. */
export const HEX_R_START = 1
export const HEX_G_START = 3
export const HEX_G_END = 5
export const HEX_B_START = 5
export const HEX_B_END = 7

// ── Re-export Enums ─────────────────────────────────────────────────
export { DefaultDisplay } from '../Enums/default-display.js'
export { SlidingWindow } from '../Enums/sliding-window.js'
export { TpsColor } from '../Enums/tps-color.js'
export { TpsThreshold } from '../Enums/tps-threshold.js'
