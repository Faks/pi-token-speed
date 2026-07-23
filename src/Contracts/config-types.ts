/**
 * Display mode — what information to show in the status bar.
 */
export type DisplayMode = 'tps' | 'ttft' | 'stats' | 'full'

/**
 * Count strategy — how to count tokens during streaming.
 */
export type CountStrategy = 'estimate' | 'direct'

/**
 * Behavior for TPS after streaming ends.
 */
export type EndTpsBehavior = 'average' | 'last'

/**
 * Configuration for the token-speed extension.
 * All fields can be overridden via ~/.pi/agent/settings.json under the "tokenSpeed" key.
 */
export interface TokenSpeedConfig {
  display: DisplayMode
  tpsSlow: number
  tpsMedium: number
  tpsFast: number
  tpsBlazing: number
  colorSlow: string
  colorMedium: string
  colorFast: string
  colorBlazing: string
  slidingWindow: number
  useProviderTokens: boolean
  countStrategy: CountStrategy
  endTpsBehavior: EndTpsBehavior
}

/**
 * Tool call payload from Pi events.
 */
export interface ToolCall {
  type: string
  name?: string
}

/**
 * Message update event payload from Pi.
 */
export interface MessageUpdatePayload {
  assistantMessageEvent: {
    type: string
    delta?: string
    partial?: {
      content?: ToolCall[]
      usage?: { output?: number }
    }
    contentIndex?: number
  }
}
