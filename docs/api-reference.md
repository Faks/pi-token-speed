# API Reference

This page provides a technical reference for the public and internal APIs of the `pi-token-speed` extension.

## TokenSpeedEngine

The core class responsible for tracking token metrics and time-based calculations.

### Methods

#### `initialize(config: { slidingWindow: number, countStrategy: CountStrategy, useProviderTokens: boolean, endTpsBehavior: EndTpsBehavior }): void`
Initializes the engine with the provided configuration. Must be called after `settings.initialize()`.

#### `start(): void`
Starts a new streaming session. Resets the token count, starts the timers, and clears the sliding window.

#### `stop(): void`
Stops the current streaming session and sets the final end time.

#### `recordDelta(delta: string, usageOutput?: number): void`
Records a streaming delta (text or thinking).
- Uses the `usageOutput` if available and valid.
- Otherwise, uses the configured `countStrategy` (`direct` or `estimate`) to count tokens in the `delta` string.

#### `reconcileTotal(tokens: number): void`
Sets the authoritative token count. Usually called at the end of a stream based on the provider's reported usage.

#### `pause(): void`
Pauses the time tracking for the session. The next `recordDelta` will automatically call `resume()`.

#### `resume(): void`
Resumes time tracking, accounting for the duration spent paused.

### Getters

#### `tpsFinal: number`
Returns the current tokens-per-second.
- If streaming, returns the current sliding window average.
- If finished, returns either the overall average or the final sliding window value (depending on `endTpsBehavior`).

#### `tpsAvg: number`
Returns the overall average TPS for the entire stream (Total Tokens / Total Elapsed Time).

#### `ttft: number`
Returns the Time to First Token (TTFT) in milliseconds.

#### `elapsedMs: number`
Returns the elapsed time in milliseconds since the stream started, excluding paused time.

#### `elapsedSeconds: number`
Returns the elapsed time in seconds since the stream started.

---

## Renderer

Responsible for all terminal output and status bar updates.

### Methods

#### `initialize(ctx: ExtensionContext): void`
Initializes the renderer and sets the initial status bar text.

#### `update(ctx: ExtensionContext): void`
Updates the status bar with the latest metrics from the engine.

#### `getColor(config: TokenSpeedConfig, tps: number | null): string`
Determines the hex color code for the TPS display based on the current speed.

#### `formatStats(tokenCount: number, elapsedSeconds: number): string`
Formats a string like `"10 tok in 2.5s"`.

#### `buildSuffix(display: DisplayMode): string`
Builds the trailing information for the status bar (e.g., TTFT or stats) based on the selected display mode.

---

## EventManager

Orchestrates the interaction between Pi's event system and the extension's core logic.

### Methods

#### `handleSessionStart(ctx: ExtensionContext): Promise<void>`
Sets up the engine and renderer, and checks for any configuration errors to notify the user.

#### `handleSessionShutdown(): void`
Gracefully stops the engine when the session ends.

#### `handleMessageStart(event: { message?: { role?: string } }): void`
Starts TTFT measurement if the message is from a user.

#### `handleMessageUpdate(event: MessageUpdatePayload, ctx: ExtensionContext): void`
Routes deltas to the engine and triggers renderer updates. Handles logic for identifying token-generating tools and prompt-processing tools.

#### `handleAgentEnd(event: AgentEndEvent, ctx: ExtensionContext): void`
Reconciles final token counts and updates the renderer one last time when the agent finishes.
