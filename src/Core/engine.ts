import type  { CountStrategy, EndTpsBehavior } from "@pi-token-speed/Interfaces/config-types";
import  { SlidingWindow } from "@pi-token-speed/Core/sliding-window";

const TOKEN_REGEX = /\w+|[^\s\w]/g;

/**
 * Core engine that tracks token speed metrics during streaming.
 *
 * State is managed via public fields for testability.
 */
export class TokenSpeedEngine {
  isStreaming = false;
  isPaused = false;

  tokenCount = 0;
  startTime = 0;
  endTime = 0;

  ttftStart = 0;
  ttftEnd = 0;

  startPause = 0;
  pausedMs = 0;

  tps = 0;
  countedUsageOutput = 0;

  slidingWindow!: SlidingWindow;
  useProviderTokens!: boolean;
  countStrategy!: CountStrategy;
  endTpsBehavior!: EndTpsBehavior;

  /**
   * Loads configuration.
   * Must be called after `settings.initialize()`.
   */
  initialize(config: {
    slidingWindow: number;
    countStrategy: CountStrategy;
    useProviderTokens: boolean;
    endTpsBehavior: EndTpsBehavior;
  }): void {
    this.slidingWindow = new SlidingWindow(config.slidingWindow);
    this.countStrategy = config.countStrategy;
    this.useProviderTokens = config.useProviderTokens;
    this.endTpsBehavior = config.endTpsBehavior;
  }

  /**
   * Records a streaming delta.
   *
   * Uses provider-reported output-token count when available.
   * Otherwise, falls back to this extension's counter.
   *
   * Counting behavior:
   * - `direct`: Counts 1 token per delta (text, thinking, toolcall)
   * - `estimate`: Approximates tokens from delta text using word-boundary regex
   *
   * @param delta The text/thinking delta string.
   * @param usageOutput Provider-reported cumulative output-token count (optional).
   */
  recordDelta(delta: string, usageOutput?: number): void {
    if (!this.isStreaming) return;
    if (this.isPaused) this.resume();

    const shouldUseProviderTokens =
      this.useProviderTokens &&
      usageOutput !== undefined &&
      usageOutput > this.countedUsageOutput;

    if (shouldUseProviderTokens) {
      this.recordTokens(usageOutput - this.countedUsageOutput);
      this.countedUsageOutput = usageOutput;
      return;
    }

    // Fallback: estimate or direct counting
    if (this.countStrategy === "estimate") {
      this.recordTokens(this.estimateTokens(delta));
    } else {
      this.recordTokens(1);
    }
  }

  /**
   * Snap the total to the authoritative usage so the final average is exact.
   *
   * @param tokens The authoritative token count from the message end event.
   */
  reconcileTotal(tokens: number): void {
    if (tokens > 0) this.tokenCount = tokens;
  }

  /**
   * Returns elapsed milliseconds since stream start (0 if not started)
   */
  get elapsedMs(): number {
    if (this.startTime === 0) return 0;
    if (this.isStreaming) return Date.now() - this.startTime - this.pausedMs;
    return this.endTime - this.startTime - this.pausedMs;
  }

  /** Returns elapsed seconds since stream start (0 if not started). */
  get elapsedSeconds(): number {
    return this.elapsedMs / 1000;
  }

  /**
   * Returns tokens-per-second based on a time-based sliding window while streaming.
   * When streaming has finished, behavior depends on `endTpsBehavior`:
   * - `"average"` (default): returns the overall average TPS for consistency with stats.
   * - `"last"`: returns the last sliding window measurement.
   */
  get tpsFinal(): number {
    if (this.isStreaming) return this.tps;
    if (this.endTpsBehavior === "last") return this.tps;
    return this.tpsAvg;
  }

  /**
   * Returns the overall average tokens-per-second for the entire stream.
   * Computed as total tokens / elapsed seconds. Returns 0 if no time has elapsed.
   */
  get tpsAvg(): number {
    if (this.elapsedSeconds <= 0) return 0;
    return this.tokenCount / this.elapsedSeconds;
  }

  /**
   * Returns time to first token in milliseconds
   */
  get ttft(): number {
    return Math.max(this.ttftEnd - this.ttftStart, 0);
  }

  /**
   * Starts a new streaming session.
   */
  start(): void {
    if (this.isStreaming) return;

    this.tokenCount = 0;
    this.isStreaming = true;
    this.startTime = Date.now();
    this.endTime = Date.now();
    this.slidingWindow.reset();
    this.countedUsageOutput = 0;
    this.tps = 0;
    this.pausedMs = 0;
  }

  /**
   * Records the start timestamp for TTFT measurement.
   */
  startTTFT(): void {
    this.ttftStart = Date.now();
    this.ttftEnd = 0;
  }

  /**
   * Records the end timestamp for TTFT measurement.
   * Only captures once per stream (guarded by ttftEnd).
   */
  stopTTFT(): void {
    if (this.ttftEnd !== 0) return;
    this.ttftEnd = Date.now();
  }

  /**
   * Stops streaming.
   */
  stop(): void {
    this.isStreaming = false;
    this.endTime = Date.now();
    this.slidingWindow.reset();
  }

  /**
   * Pauses the timer. Call before a non-edit/write tool call ends.
   * The next `recordDelta` will call `resume()`.
   */
  pause(): void {
    this.isPaused = true;
    this.startPause = Date.now();
  }

  /**
   * Resumes the timer, updating the paused time.
   */
  resume(): void {
    this.isPaused = false;
    this.pausedMs += Date.now() - this.startPause;
  }

  /**
   * Records a batch of tokens, pushing a timestamped event for TPS calculation.
   *
   * @param tokens The number of tokens to record.
   */
  recordTokens(tokens: number): void {
    if (!this.isStreaming || tokens <= 0) return;

    this.tokenCount += tokens;
    this.slidingWindow.record(tokens);
    this.tps = this.slidingWindow.getTps(Date.now());
  }

  /**
   * Estimates tokens in a text string using a word-boundary regex.
   * Used as a fallback when the provider doesn't report token counts.
   *
   * @param text The text to estimate token count for.
   * @returns The estimated number of tokens.
   */
  estimateTokens(text: string): number {
    if (!text) return 0;
    const matches = text.match(TOKEN_REGEX);
    return matches ? matches.length : 0;
  }
}
