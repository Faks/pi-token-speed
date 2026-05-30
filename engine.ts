import { COMPACTION_THRESHOLD, TPS_WINDOW_MS } from "./constants";

export class TokenSpeedEngine {
  private _isStreaming = false;
  private _tokenCount = 0;
  private _startTime = 0;
  private _endTime = 0;
  private _tokenTimestamps: number[] = [];
  private _windowStartIndex = 0;

  /**
   * Whether a streaming session is currently active
   */
  get isStreaming() {
    return this._isStreaming;
  }

  /**
   * Total number of tokens recorded since stream start
   */
  get tokenCount() {
    return this._tokenCount;
  }

  /**
   * Returns elapsed milliseconds since stream start (0 if not started)
   */
  get elapsedMs(): number {
    if (this._startTime === 0) return 0;
    if (this.isStreaming) return Date.now() - this._startTime;

    return this._endTime - this._startTime;
  }

  /**
   * Returns elapsed seconds since stream start (0 if not started)
   */
  get elapsedSeconds(): number {
    return this.elapsedMs / 1000;
  }

  /**
   * Returns tokens-per-second based on a time-based sliding window.
   * Uses the actual span of timestamps in the window for sub-second granularity
   */
  get tps(): number {
    // While the window is still filling, use the average instead
    if (this.elapsedMs < TPS_WINDOW_MS) return this.tps_avg;

    // While we're stopped, return our last calculation
    if (!this.isStreaming) return this.tps_avg;

    this._endTime = Date.now();
    const windowStart = this._endTime - TPS_WINDOW_MS;

    // Advance the window start index
    while (
      this._windowStartIndex < this._tokenTimestamps.length &&
      this._tokenTimestamps[this._windowStartIndex] < windowStart
    ) {
      this._windowStartIndex++;
    }

    const windowTokenCount =
      this._tokenTimestamps.length - this._windowStartIndex;
    if (windowTokenCount === 0) return this.tps_avg;

    // Use the actual time span of tokens in the window for finer precision
    const windowDuration =
      (this._endTime - this._tokenTimestamps[this._windowStartIndex]) / 1000;
    if (windowDuration === 0) return 0;

    return windowTokenCount / windowDuration;
  }

  /**
   * Returns average tokens-per-second
   */
  private get tps_avg(): number {
    if (this.elapsedSeconds === 0) return 0;
    return this.tokenCount / this.elapsedSeconds;
  }

  /**
   * Starts a new streaming session.
   */
  start() {
    this._tokenCount = 0;
    this._isStreaming = true;
    this._startTime = Date.now();
    this._endTime = Date.now();
    this._tokenTimestamps = [];
    this._windowStartIndex = 0;
  }

  /**
   * Stops streaming
   */
  stop() {
    this._isStreaming = false;
    // Release memory — discard accumulated timestamps
    this._tokenTimestamps = [];
    this._windowStartIndex = 0;
  }

  /**
   * Records a token. The current time is used for the sliding window.
   */
  recordToken() {
    if (!this._isStreaming) return;

    this._tokenCount++;
    this._tokenTimestamps.push(Date.now());

    // Compact periodically to prevent unbounded growth during long streams
    if (this._windowStartIndex >= COMPACTION_THRESHOLD) {
      this._compact();
    }
  }

  /**
   * Removes the dead prefix of the timestamp array to free memory.
   */
  private _compact() {
    if (this._windowStartIndex === 0) return;
    this._tokenTimestamps = this._tokenTimestamps.slice(this._windowStartIndex);
    this._windowStartIndex = 0;
  }
}
