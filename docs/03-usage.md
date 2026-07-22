# Usage

## Commands

### `/tps`

Open the interactive settings menu to configure display mode, token counting strategy, and provider token usage.

```
/tps
```

Displays a SettingsList with the following options:

| Option              | Values                        | Description                                                      |
| ------------------- | ----------------------------- | ---------------------------------------------------------------- |
| Display mode        | `tps`, `ttft`, `stats`, `full` | Level of detail to show in the status bar                        |
| Use provider tokens | `On`, `Off`                   | Use provider-reported counts instead of the extension's counter  |
| Count strategy      | `estimate`, `direct`          | How the extension counts tokens                                  |
| End-of-stream TPS   | `average`, `last`             | What to show after streaming ends                                |

Changes are persisted to `~/.pi/agent/settings.json` immediately and the status bar updates.

## Streaming Lifecycle

The extension hooks into Pi's event system to track token streaming:

### Session Start

When a new session begins, the extension:

1. Initializes configuration (loads user settings, validates, applies defaults)
2. Renders the initial status bar entry showing `⚡ TPS: --`
3. Displays warnings if any configuration corrections were made

### Message Start

When a message starts streaming:

- **User message**: Begins TTFT (Time To First Token) measurement
- **Assistant message**: Waits for the first content block to start

### First Token & Streaming Start

The moment the first content block starts (`text_start`, `thinking_start`, or `toolcall_start`):

1. TTFT measurement stops — the elapsed time is recorded
2. Streaming engine starts — begins tracking token throughput
3. Status bar begins showing live TPS values

### Token Update

Each token delta is processed:

1. **Text/thinking deltas**: Recorded with current timestamp
2. **Toolcall deltas**: Only `edit` and `write` tools are counted
3. **Provider tokens**: If `useProviderTokens` is `true`, provider-reported counts are used
4. **Sliding window**: TPS is recalculated using tokens within the window
5. **Renderer update**: Status bar is updated with new TPS value

### Toolcall End

When a tool call ends:

- **Prompt processing tools** (not `edit`/`write`): Timer is paused to prevent skewing TPS
- **Token generation tools** (`edit`/`write`): Timer continues normally

### Agent End

When the agent finishes:

1. Streaming stops
2. Authoritative token count (if available) is used to snap the total
3. TPS behavior depends on `endTpsBehavior`:
   - `average`: Returns overall average TPS
   - `last`: Returns last sliding window TPS
4. Status bar is updated with final values

## Timer Pausing

The extension automatically pauses the TPS timer when a prompt processing tool call ends. This prevents tool processing time from skewing the TPS calculation.

### How It Works

| Tool Type            | Example          | Timer Behavior |
| -------------------- | ---------------- | -------------- |
| Token generation     | `edit`, `write`  | Continues      |
| Prompt processing    | `read`, `grep`   | Paused         |

The timer resumes when the next token delta arrives.

## Provider Token Counts

When `useProviderTokens` is `true`, the extension uses the provider's reported token counts instead of its own counter:

| Scenario                              | Behavior                                          |
| ------------------------------------- | ------------------------------------------------- |
| Provider reports count                | Uses provider's count                             |
| Provider doesn't report count         | Falls back to `countStrategy`                     |
| Provider count is lower than previous | Falls back to `countStrategy` (count never goes backward) |

> **Note:** The extension's own counter is the default and always available. Enable provider tokens when your provider reports accurate counts and you'd prefer to use them.

## Sliding Window Calculation

TPS is calculated using a time-based sliding window:

```
TPS = (tokens in window) / (time span in seconds)
```

### Window Mechanics

1. **Recording**: Each token delta is recorded with a timestamp
2. **Pruning**: Events older than the window are excluded from calculation
3. **Span clamping**: Minimum span of `100ms` prevents burst spikes
4. **Compaction**: Every 5000 events, old events are pruned to prevent memory growth

### Recommended Windows

| Server speed        | Window  | Why                                                       |
| ------------------- | ------- | --------------------------------------------------------- |
| Fast (30+ tok/s)    | 1000ms  | Plenty of tokens — accurate and responsive                |
| Medium (5–30 tok/s) | 1000–3000ms | Enough tokens for stable readings                    |
| Slow (< 5 tok/s)    | 5000–15000ms | Captures more tokens, avoiding spiky values           |

## End-of-Stream TPS Behavior

After streaming ends, the `endTpsBehavior` option controls what TPS value is displayed:

| Behavior            | Calculation                                                | Use Case                                  |
| ------------------- | ---------------------------------------------------------- | ----------------------------------------- |
| `average` (default) | `total tokens / total elapsed seconds`                     | Consistent with stats display             |
| `last`              | Last sliding window measurement from when streaming stopped | Seeing how fast the model was at the end |

## Next Steps

- [Display Modes](./04-display-modes.md) — Detailed breakdown of each display mode
- [Troubleshooting](./05-troubleshooting.md) — Resolve common issues
