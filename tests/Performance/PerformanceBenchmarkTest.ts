import { describe, expect, it } from 'vitest'
import { TokenSpeedEngine } from '../../src/Core/engine.js'

const MOCK_CONFIG = {
  slidingWindow: 1000,
  countStrategy: 'direct' as const,
  useProviderTokens: false,
  endTpsBehavior: 'average' as const
}

const RECORD_COUNT = 10_000
const MAX_DURATION_MS = 500

describe('Performance Benchmark', () => {
  it('records 10,000 tokens quickly', () => {
    const engine = new TokenSpeedEngine()
    engine.initialize(MOCK_CONFIG)

    const start = performance.now()
    let i = 0
    while (i < RECORD_COUNT) {
      engine.recordDelta('test')
      i += 1
    }
    const end = performance.now()
    const duration = end - start
    expect(duration).toBeLessThan(MAX_DURATION_MS)
  })
})
