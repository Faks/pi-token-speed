# Getting Started

## Installation

Install the extension using one of the following methods:

```bash
# From GitHub
pi install https://github.com/faks/pi-token-speed
```

## Prerequisites

- A running [llama.cpp server](https://github.com/ggml-org/llama.cpp) (local or remote)
- Pi Coding Agent installed and configured
- Pi TUI installed (bundled with Pi Coding Agent)

### Starting the Server

**Single model:**

```bash
llama-server --model path/to/model.gguf --port 8080
```

**Multi-model router:**

```bash
llama-server --models-preset path/to/presets.ini --port 8080
```

**With API authentication:**

```bash
llama-server --model path/to/model.gguf --port 8080 --api-key your-secret-key
```

**With auto-sleep:**

```bash
llama-server --model path/to/model.gguf --port 8080 --sleep-idle-seconds 300
```

## Quick Start

1. Start your llama.cpp server
2. Start a conversation in Pi
3. Watch the status bar display real-time TPS metrics

The extension auto-detects your server and begins measuring token throughput immediately.

## Status Bar

The status bar displays the TPS measurement in the following format:

```
⚡ TPS: 25.0 tok/s
```

The color of the TPS value indicates the speed tier:

| Icon | Speed Tier | TPS Range | Color              |
|------|------------|-----------|--------------------|
| 🟥   | Slow       | 0–15      | `#ff4444` (red)    |
| 🟨   | Medium     | 15–30     | `#ffaa00` (orange) |
| 🟩   | Fast       | 30–45     | `#00ff88` (green)  |
| 🟦   | Blazing    | 45+       | `#44ddff` (cyan)   |

> **Note:** The initial status bar shows `⚡ TPS: --` until the first token is streamed.

## How It Works

The extension measures token throughput using a time-based sliding window:

1. **Session Start** — Renders the initial status bar entry showing `⚡ TPS: --`
2. **Message Start** — When a user message starts, TTFT (Time To First Token) measurement begins
3. **First Token** — The moment the first content block starts, the TTFT is recorded and streaming begins
4. **Token Updates** — Each token delta is recorded with a timestamp
5. **TPS Calculation** — Tokens within the sliding window are divided by the time span
6. **Agent End** — The authoritative token count (if available) is used to snap the total

## Sliding Window

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

## Timer Pausing

The extension automatically pauses the TPS timer when a prompt processing tool call ends (any tool other than `edit` or `write`). This prevents tool processing time from skewing the TPS calculation. The timer resumes when the next token delta arrives.

## Next Steps

- [Configuration](./02-configuration.md) — Learn how to customize the extension
- [Usage](./03-usage.md) — Explore commands and display modes
- [API Reference](./api-reference.md) — Technical details for developers
- [Performance](./performance-benchmarks.md) — Benchmarking and math details
- [Troubleshooting](./05-troubleshooting.md) — Resolve common issues
