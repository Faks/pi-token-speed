import type { CountStrategy, DisplayMode, EndTpsBehavior } from '../Contracts/config-types.js'

/** Default display configuration. */
export const DefaultDisplay = {
  Mode: 'tps' as DisplayMode,
  UseProviderTokens: false,
  CountStrategy: 'direct' as CountStrategy,
  EndTpsBehavior: 'average' as EndTpsBehavior
} as const
