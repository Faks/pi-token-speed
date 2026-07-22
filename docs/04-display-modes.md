# Display Modes

## Overview

The `display` configuration option controls what information is shown in the status bar alongside the TPS measurement. Four modes are available:

| Mode    | Format                                              | Information Shown                          |
| ------- | --------------------------------------------------- | ------------------------------------------ |
| `tps`   | `⚡ TPS: 25.0 tok/s`                                | TPS with color-coded speed tier            |
| `ttft`  | `⚡ TPS: 25.0 tok/s (TTFT: 450 ms)`                 | TPS + time-to-first-token                  |
| `stats` | `⚡ TPS: 25.0 tok/s (150 tok in 6.0s)`              | TPS + token count and elapsed time         |
| `full`  | `⚡ TPS: 25.0 tok/s (150 tok in 6.0s · TTFT: 450 ms)` | Everything — TPS, stats, and TTFT         |

## Speed Tiers

The TPS value is color-coded based on four speed tiers:

| Tier       | TPS Range | Color              | Hex Code   |
| ---------- | --------- | ------------------ | ---------- |
| 🟥 Slow    | 0–15      | Red                | `#ff4444`  |
| 🟨 Medium  | 15–30     | Orange             | `#ffaa00`  |
| 🟩 Fast    | 30–45     | Green              | `#00ff88`  |
| 🟦 Blazing | 45+       | Cyan               | `#44ddff`  |

> **Note:** Speed thresholds are configurable. See [Configuration](./02-configuration.md) for customization options.

## TPS Mode

**Default mode** — Shows only the current TPS value with color-coded speed tier.

```
⚡ TPS: 25.0 tok/s
```

Use this mode when you want a clean, minimal status bar that focuses solely on throughput performance.

## TTFT Mode

Shows TPS alongside time-to-first-token (TTFT) — the latency from user message to first token.

```
⚡ TPS: 25.0 tok/s (TTFT: 450 ms)
```

TTFT is measured from when a user message starts to when the first token is generated. A lower TTFT indicates faster response times.

## Stats Mode

Shows TPS alongside token count and elapsed time.

```
⚡ TPS: 25.0 tok/s (150 tok in 6.0s)
```

The stats portion shows:
- **Token count**: Total tokens streamed in the current session
- **Elapsed time**: Total time elapsed since streaming started

Format: `<x> tok in <y>s`

## Full Mode

Shows everything — TPS, token stats, and TTFT.

```
⚡ TPS: 25.0 tok/s (150 tok in 6.0s · TTFT: 450 ms)
```

Use this mode when you want complete visibility into streaming performance.

## Color Rendering

Colors are applied using 24-bit truecolor ANSI escape codes:

```
\x1b[38;2;${r};${g};${b}m${text}\x1b[0m
```

This requires a terminal that supports truecolor (most modern terminals do). If your terminal doesn't support truecolor, the text will render without color.

## Customizing Speed Tiers

You can customize the speed thresholds and colors to match your server's performance profile:

```json
{
  "tokenSpeed": {
    "tpsSlow": 0,
    "tpsMedium": 20,
    "tpsFast": 40,
    "tpsBlazing": 60,
    "colorSlow": "#ff4444",
    "colorMedium": "#ffaa00",
    "colorFast": "#00ff88",
    "colorBlazing": "#00aaff"
  }
}
```

> **Note:** Thresholds must be in ascending order: `tpsSlow < tpsMedium < tpsFast < tpsBlazing`. Invalid order triggers a warning and resets to defaults.

## Next Steps

- [Troubleshooting](./05-troubleshooting.md) — Resolve common issues
