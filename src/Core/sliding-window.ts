import { COMPACTION_THRESHOLD, MS_PER_SECOND, SlidingWindow as SlidingWindowConfig } from '../Config/app.js'

/**
 * Time-based sliding window for calculating tokens-per-second.
 *
 * Records timestamped token events and calculates TPS by summing tokens
 * within the most recent window. Compacts old events periodically to
 * prevent unbounded memory growth.
 */
export class SlidingWindow {
  readonly events: { time: number; tokens: number }[] = []
  windowStartIndex = 0
  runningSum = 0
  readonly windowMs: number

  constructor(windowMs: number) {
    this.windowMs = windowMs
  }

  /**
   * Records a batch of tokens with the current timestamp.
   * Compacts old events when the index reaches the compaction threshold.
   *
   * @param tokens The number of tokens to record.
   */
  record(tokens: number): void {
    this.events.push({ time: Date.now(), tokens })
    this.runningSum += tokens

    if (this.windowStartIndex >= COMPACTION_THRESHOLD) {
      this.compact()
    }
  }

  /**
   * Calculates tokens-per-second within the sliding window.
   *
   * Divides tokens in the window by the actual time span (clamped to a
   * minimum of `MIN_SLIDING_WINDOW` to avoid burst spikes).
   * Returns 0 if no tokens are in the window.
   *
   * @param now Current timestamp in milliseconds.
   * @returns Tokens per second, or 0 if the window is empty.
   */
  getTps(now: number): number {
    if (this.events.length === 0) {
      return 0
    }

    const windowStart = now - this.windowMs

    // Advance past events older than the window
    while (this.windowStartIndex < this.events.length && this.events[this.windowStartIndex].time < windowStart) {
      this.runningSum -= this.events[this.windowStartIndex].tokens
      this.windowStartIndex += 1
    }

    if (this.windowStartIndex >= this.events.length) {
      this.runningSum = 0
      return 0
    }

    if (this.runningSum === 0) {
      return 0
    }

    // Use the actual span but clamp to a minimum to avoid burst spikes.
    const rawSpan = now - this.events[this.windowStartIndex].time
    const span = Math.max(rawSpan, SlidingWindowConfig.Min)
    return (MS_PER_SECOND * this.runningSum) / span
  }

  /**
   * Removes the dead prefix of the events array to free memory.
   * Called periodically when `windowStartIndex` reaches the compaction threshold.
   */
  compact(): void {
    if (this.windowStartIndex === 0) {
      return
    }
    this.runningSum = 0
    this.events.splice(0, this.windowStartIndex)
    this.windowStartIndex = 0
  }

  /**
   * Resets the window, discarding all recorded events.
   */
  reset(): void {
    this.events.length = 0
    this.windowStartIndex = 0
    this.runningSum = 0
  }
}
