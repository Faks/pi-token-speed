# Configuration

## Overview

The extension resolves configuration using a priority chain:

1. **User settings** — `~/.pi/agent/settings.json` under the `tokenSpeed` key
2. **Defaults** — Built-in defaults if no user settings are found

Configuration is validated at initialization. Invalid values are automatically corrected to their defaults, and a warning notification is displayed in the Pi status bar.

## Configuration File

Add a `tokenSpeed` section to your `~/.pi/agent/settings.json`:

```json
{
  "tokenSpeed": {
    "tpsSlow": 0,
    "tpsMedium": 15,
    "tpsFast": 30,
    "tpsBlazing": 45,
    "colorSlow": "#ff4444",
    "colorMedium": "#ffaa00",
    "colorFast": "#00ff88",
    "colorBlazing": "#44ddff",
    "slidingWindow": 1000,
    "display": "tps",
    "useProviderTokens": false,
    "countStrategy": "direct",
    "endTpsBehavior": "average"
  }
}
```

> **Note:** Only the options you want to customize need to be included. Unspecified options use their defaults.

## Configuration Options

### TPS Thresholds

| Option         | Type   | Default | Description                                      |
| -------------- | ------ | ------- | ------------------------------------------------ |
| `tpsSlow`      | number | `0`     | Minimum TPS threshold ("slow")                   |
| `tpsMedium`    | number | `15`    | TPS above this is "medium"                       |
| `tpsFast`      | number | `30`    | TPS above this is "fast"                         |
| `tpsBlazing`   | number | `45`    | TPS above this is "blazing"                      |

> **Note:** Thresholds must be in ascending order: `tpsSlow < tpsMedium < tpsFast < tpsBlazing`. Invalid order triggers a warning and resets to defaults.

### Speed Colors

| Option        | Type   | Default    | Description                          |
| ------------- | ------ | ---------- | ------------------------------------ |
| `colorSlow`   | string | `"#ff4444"` | Color for slow tier                  |
| `colorMedium` | string | `"#ffaa00"` | Color for medium tier                |
| `colorFast`   | string | `"#00ff88"` | Color for fast tier                  |
| `colorBlazing`| string | `"#44ddff"` | Color for blazing tier               |

Colors must be valid 24-bit truecolor ANSI hex strings (e.g., `#00ff88`). Invalid colors trigger a warning and reset to defaults.

### Sliding Window

| Option          | Type   | Default | Range        | Description                              |
| --------------- | ------ | ------- | ------------ | ---------------------------------------- |
| `slidingWindow` | number | `1000`  | 100–30000 ms | Window duration for TPS calculation      |

The sliding window is clamped between `100ms` and `30000ms` (30s). Invalid values are corrected to `1000ms`.

### Display Mode

| Option    | Type                                 | Default | Description                              |
| --------- | ------------------------------------ | ------- | ---------------------------------------- |
| `display` | `tps`, `ttft`, `stats`, `full`       | `tps`   | Display mode for the status bar          |

See [Display Modes](./04-display-modes.md) for detailed descriptions of each mode.

### Provider Token Counts

| Option              | Type    | Default | Description                                                      |
| ------------------- | ------- | ------- | ---------------------------------------------------------------- |
| `useProviderTokens` | boolean | `false` | Use provider-reported counts instead of the extension's counter  |

When `true`, the extension uses the provider's reported token counts (e.g., Anthropic, OpenAI). Falls back to the extension's counter when provider counts are unavailable.

### Count Strategy

| Option          | Type                           | Default    | Description                                                      |
| --------------- | ------------------------------ | ---------- | ---------------------------------------------------------------- |
| `countStrategy` | `estimate`, `direct`           | `direct`   | Token counting strategy used by the extension's own counter      |

- **`direct`** (default): Counts each delta as 1 token
- **`estimate`**: Approximates tokens from delta text using word-boundary regex

Use `estimate` when your server streams in small chunks — it gives a more meaningful TPS reading.

### End-of-Stream TPS Behavior

| Option            | Type                          | Default   | Description                                                      |
| ----------------- | ----------------------------- | --------- | ---------------------------------------------------------------- |
| `endTpsBehavior`  | `average`, `last`             | `average` | What to show after streaming ends                                |

- **`average`** (default): Returns the overall average TPS (`total tokens / total elapsed seconds`)
- **`last`**: Returns the last sliding window TPS measurement from when streaming stopped

## Validation

The extension validates configuration at startup. Invalid values are automatically corrected, and a warning notification lists all corrections:

```
[pi-token-speed]
- Invalid display "invalid" — defaulting to "tps".
- TPS thresholds must be in ascending order.
  Found: 30 < 15 < 45 < 60.
```

### Validation Rules

| Option              | Rule                                          | Correction                     |
| ------------------- | --------------------------------------------- | ------------------------------ |
| `display`           | Must be `tps`, `ttft`, `stats`, or `full`     | Falls back to `tps`            |
| `countStrategy`     | Must be `estimate` or `direct`                | Falls back to `direct`         |
| `useProviderTokens` | Must be a boolean                             | Falls back to `false`          |
| `slidingWindow`     | Must be a number between 100 and 30000        | Falls back to `1000`           |
| `endTpsBehavior`    | Must be `average` or `last`                   | Falls back to `average`        |
| Thresholds          | Must be in ascending order                    | Resets all to defaults         |
| Colors              | Must be valid 24-bit hex strings (`#RRGGBB`)  | Resets all to defaults         |

## Interactive Menu

Run `/tps` in Pi to open an interactive settings menu:

```
/tps
```

The menu provides a user-friendly interface to adjust:

- **Display mode** — What to show in the status bar
- **Use provider tokens** — Use provider-reported counts instead of the extension's counter
- **Count strategy** — How the extension counts tokens (`estimate` or `direct`)
- **End-of-stream TPS** — What to show after streaming ends (`average` or `last`)

Changes are persisted to `~/.pi/agent/settings.json` immediately.

## Provider Token Counts

By default, this extension uses its own token counter — the same engine behind `countStrategy`. As an alternative, you can opt in to using the provider's own reported counts instead:

| Value             | Behavior                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------- |
| `false` (default) | Use this extension's own counter (controlled by `countStrategy`)                            |
| `true`            | Use the provider's reported counts instead; fall back to `countStrategy` when not available |

The extension's own counter is the default and always available. Enable `useProviderTokens: true` when your provider reports accurate token counts and you'd prefer to use them instead.

## Count Strategy

When `useProviderTokens` is `false` (default) or when the provider doesn't report counts, the `countStrategy` determines how the extension's own counter works:

| Strategy           | Behavior                            |
| ------------------ | ----------------------------------- |
| `direct` (default) | Counts each delta as 1 token        |
| `estimate`         | Approximates tokens from delta text |

The `direct` strategy is fast and preserves the original behavior — it counts each streaming delta as 1 token, including toolcalls for `edit` and `write` operations. Use `estimate` when your server streams in small chunks — it approximates the real token count from the delta text, giving a more meaningful TPS reading.

> **Note:** Only `edit` and `write` tool call deltas are counted. Other tool calls (prompt processing) are excluded from token counting.

## Next Steps

- [Usage](./03-usage.md) — Learn about commands and display modes
- [Display Modes](./04-display-modes.md) — Detailed breakdown of each display mode
- [Troubleshooting](./05-troubleshooting.md) — Resolve common issues
