# pi-token-speed

A [Pi Coding Agent](https://pi.dev/) extension that displays real-time **tokens-per-second (TPS)** performance metrics in the status bar while the AI is streaming responses.

## Features

- **Real-time TPS tracking** — measures token throughput as the assistant generates text and thinking content
- **Configurable sliding window** — adjust the window size to suit your server speed (default: 1s)
- **Color-coded speed indicators** — visual feedback based on performance thresholds
- **Fully configurable** — customize display, thresholds and colors via `~/.pi/agent/settings.json`

## Speed Tiers

| Tier       | TPS   | Color              |
| ---------- | ----- | ------------------ |
| 🟥 Slow    | 0–15  | `#ff4444` (red)    |
| 🟨 Medium  | 15–30 | `#ffaa00` (orange) |
| 🟩 Fast    | 30–45 | `#00ff88` (green)  |
| 🟦 Blazing | 45+   | `#44ddff` (cyan)   |

## Installation

This package is a Pi extension. Install it with

```bash
npm install pi-token-speed
```

or

```bash
pi install https://github.com/gsanhueza/pi-token-speed
```

## Configuration

You can customize the display, speed thresholds and colors by adding a `tokenSpeed` section to your `~/.pi/agent/settings.json`:

```json
{
  "tokenSpeed": {
    "display": "tps",
    "tpsSlow": 0,
    "tpsMedium": 15,
    "tpsFast": 30,
    "tpsBlazing": 45,
    "colorSlow": "#ff4444",
    "colorMedium": "#ffaa00",
    "colorFast": "#00ff88",
    "colorBlazing": "#44ddff",
    "slidingWindow": 1000
  }
}
```

### Configuration Options

| Option          | Type          | Default     | Description                          |
| --------------- | ------------- | ----------- | ------------------------------------ |
| `display`       | `tps`, `full` | `tps`       | Display only TPS or full information |
| `tpsSlow`       | number        | `0`         | Minimum TPS threshold ("slow")       |
| `tpsMedium`     | number        | `15`        | TPS above this is "medium"           |
| `tpsFast`       | number        | `30`        | TPS above this is "fast"             |
| `tpsBlazing`    | number        | `45`        | TPS above this is "blazing"          |
| `colorSlow`     | string        | `"#ff4444"` | Color for slow tier                  |
| `colorMedium`   | string        | `"#ffaa00"` | Color for medium tier                |
| `colorFast`     | string        | `"#00ff88"` | Color for fast tier                  |
| `colorBlazing`  | string        | `"#44ddff"` | Color for blazing tier               |
| `slidingWindow` | number        | `1000`      | Sliding window duration in ms        |

### Sliding Window

The sliding window determines how many recent tokens are used to calculate TPS. A larger window produces smoother readings at the cost of responsiveness; a smaller window reacts faster but can be noisier.

| Server speed        | Recommended window | Why                                                       |
| ------------------- | ------------------ | --------------------------------------------------------- |
| Fast (30+ tok/s)    | `1000` (default)   | Plenty of tokens in the window — accurate and responsive  |
| Medium (5–30 tok/s) | `1000`–`3000`      | Enough tokens for stable readings                         |
| Slow (< 5 tok/s)    | `5000`–`15000`     | Captures more tokens, avoiding spiky or unreliable values |

For example, if your server streams at ~1 tok/s, a 10-second window gives ~10 tokens per window — enough for a reasonable calculation:

```json
{
  "tokenSpeed": {
    "slidingWindow": 10000
  }
}
```

## Commands

| Command | Description                                                                      |
| ------- | -------------------------------------------------------------------------------- |
| `/tps`  | Toggle display mode between `tps` (just the speed) and `full` (full information) |

## How It Works

1. **Session Start** — Renders the initial status bar entry showing `⚡ TPS: --`
2. **Message Start** — When the assistant begins streaming, the engine starts tracking
3. **Token Update** — Each text/thinking delta increments the token counter and updates the display
4. **Sliding Window** — TPS is calculated using a configurable time window of token timestamps
5. **Message End** — Final average TPS is displayed for the full response

## Dependencies

| Dependency                        | Purpose                               |
| --------------------------------- | ------------------------------------- |
| `@earendil-works/pi-coding-agent` | Pi Coding Agent SDK (peer dependency) |
