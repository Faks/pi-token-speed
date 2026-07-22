# Display Modes

The `pi-token-speed` extension offers several display modes to balance information density and readability.

| Mode | Visual Description | Best For |
|---|---|---|
| `tps` | Shows current tokens per second. | High-frequency tracking. |
| `ttft` | Highlights Time to First Token (TTFT). | Latency analysis. |
| `stats` | Shows total token count and elapsed time. | Progress tracking. |
| `full` | Shows all available metrics simultaneously. | Comprehensive analysis. |

## How it works
Each mode uses a specific "suffix" in the status bar. These suffixes are appended automatically by the `Renderer` based on your current selection in the `/tps` configuration menu.
