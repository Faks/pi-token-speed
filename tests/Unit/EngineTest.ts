import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TokenSpeedEngine } from '../../src/Core/engine.js'

vi.useFakeTimers()

const MOCK_CONFIG = {
  slidingWindow: 1000,
  countStrategy: 'direct' as const,
  useProviderTokens: false,
  endTpsBehavior: 'average' as const
}

describe('TokenSpeedEngine', () => {
  let engine: TokenSpeedEngine

  beforeEach(() => {
    engine = new TokenSpeedEngine()
    engine.initialize(MOCK_CONFIG)
  })

  describe('start / stop', () => {
    it('starts streaming', () => {
      expect(engine.isStreaming).toBe(false)
      engine.start()
      expect(engine.isStreaming).toBe(true)
    })

    it("is idempotent — double start doesn't reset", () => {
      const now = Date.now()
      vi.setSystemTime(now)
      engine.start()
      vi.setSystemTime(now + 1000)
      engine.start()
      expect(engine.elapsedMs).toBe(1000)
    })

    it('stops streaming', () => {
      engine.start()
      engine.stop()
      expect(engine.isStreaming).toBe(false)
    })
  })

  describe('token counting — direct', () => {
    it('counts 1 token per recordDelta call', () => {
      engine.start()
      engine.recordDelta('hello')
      expect(engine.tokenCount).toBe(1)
      engine.recordDelta('world')
      expect(engine.tokenCount).toBe(2)
      engine.recordDelta('!')
      expect(engine.tokenCount).toBe(3)
    })

    it('does not count when not streaming', () => {
      engine.recordDelta('hello')
      expect(engine.tokenCount).toBe(0)
    })

    it('auto-resumes on recordDelta — counts after pause', () => {
      engine.start()
      engine.pause()
      engine.recordDelta('hello')
      expect(engine.tokenCount).toBe(1)
    })
  })

  describe('reconcileTotal', () => {
    it('sets token count to the authoritative value', () => {
      engine.start()
      engine.recordDelta('hello')
      engine.recordDelta('world')
      expect(engine.tokenCount).toBe(2)
      engine.reconcileTotal(10)
      expect(engine.tokenCount).toBe(10)
    })

    it('does not change count for zero or negative values', () => {
      engine.start()
      engine.recordDelta('hello')
      expect(engine.tokenCount).toBe(1)
      engine.reconcileTotal(0)
      expect(engine.tokenCount).toBe(1)
      engine.reconcileTotal(-1)
      expect(engine.tokenCount).toBe(1)
    })
  })

  describe('elapsed time', () => {
    it('returns 0 before start', () => {
      expect(engine.elapsedMs).toBe(0)
      expect(engine.elapsedSeconds).toBe(0)
    })

    it('tracks elapsed time while streaming', () => {
      const now = Date.now()
      vi.setSystemTime(now)
      engine.start()
      vi.setSystemTime(now + 2500)
      expect(engine.elapsedMs).toBe(2500)
      expect(engine.elapsedSeconds).toBe(2.5)
    })

    it('tracks elapsed time after stop', () => {
      const now = Date.now()
      vi.setSystemTime(now)
      engine.start()
      vi.setSystemTime(now + 2500)
      engine.stop()
      vi.setSystemTime(now + 5000)
      expect(engine.elapsedMs).toBe(2500)
    })

    it('excludes paused time from elapsed', () => {
      const now = Date.now()
      vi.setSystemTime(now)
      engine.start()
      vi.setSystemTime(now + 1000)
      engine.pause()
      vi.setSystemTime(now + 2000)
      engine.recordDelta('hello')
      vi.setSystemTime(now + 3000)
      expect(engine.elapsedMs).toBe(2000)
    })
  })

  describe('TTFT', () => {
    it('returns 0 before TTFT measurement', () => {
      expect(engine.ttft).toBe(0)
    })

    it('captures TTFT between startTtft and stopTtft', () => {
      const now = Date.now()
      vi.setSystemTime(now)
      engine.startTtft()
      vi.setSystemTime(now + 150)
      engine.stopTtft()
      expect(engine.ttft).toBe(150)
    })

    it('only captures TTFT once', () => {
      const now = Date.now()
      vi.setSystemTime(now)
      engine.startTtft()
      vi.setSystemTime(now + 100)
      engine.stopTtft()
      vi.setSystemTime(now + 500)
      engine.stopTtft()
      expect(engine.ttft).toBe(100)
    })
  })

  describe('TPS', () => {
    it('returns 0 before start', () => {
      expect(engine.tpsFinal).toBe(0)
    })

    it('returns tpsAvg after streaming stops', () => {
      const now = Date.now()
      vi.setSystemTime(now)
      engine.start()
      engine.recordDelta('hello')
      engine.recordDelta('world')
      vi.setSystemTime(now + 2000)
      engine.stop()
      expect(engine.tpsFinal).toBeCloseTo(1, 0)
    })
  })

  describe('pause / resume', () => {
    it('pauses the timer — elapsed excludes paused period after resume', () => {
      const now = Date.now()
      vi.setSystemTime(now)
      engine.start()
      vi.setSystemTime(now + 1000)
      engine.pause()
      vi.setSystemTime(now + 2000)
      // pausedMs is only updated when resume() is called (via recordDelta)
      // Before resume, elapsedMs = Date.now() - startTime - 0 = 2000
      engine.recordDelta('hello') // triggers resume, pausedMs = 1000
      vi.setSystemTime(now + 3000)
      // 3000 - 0 - 1000 = 2000ms (excludes 1000ms pause)
      expect(engine.elapsedMs).toBe(2000)
    })

    it('resumes on next recordDelta', () => {
      const now = Date.now()
      vi.setSystemTime(now)
      engine.start()
      vi.setSystemTime(now + 1000)
      engine.pause()
      vi.setSystemTime(now + 2000)
      engine.recordDelta('hello')
      vi.setSystemTime(now + 3000)
      // 1000ms before pause + 1000ms after resume = 2000ms
      expect(engine.elapsedMs).toBe(2000)
    })
  })
})
