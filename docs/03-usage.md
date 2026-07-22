# Usage Guide

This guide describes how to interact with the `pi-token-speed` extension.

## Key Commands

### `/tps` — Configuration Menu
Use the `/tps` command to open the settings menu. From here, you can adjust:

- **Display Mode**: Choose how the TPS data is visualized in the status bar (`tps`, `ttft`, `stats`, `full`).
- **Use Provider Tokens**: Toggle whether to use the token counts provided by the LLM provider or the local counter.
- **Count Strategy**:
    - `direct`: The engine counts tokens as they are streamed.
    - `estimate`: The engine estimates tokens based on chunk sizes (useful for providers that don't stream token counts).
- **End-of-stream TPS**: Determine whether the status bar shows the *overall average* or the *final sliding window* value once the stream completes.

## Lifecycle of a Stream

When a tool call involving an LLM is initiated, the extension follows these steps:

1.  **Initialization**: The extension initializes the `TokenSpeedEngine` with your current configuration.
2.  **TTFT (Time to First Token)**: The engine starts measuring the time from the tool call initiation until the first token is received.
3.  **Streaming**: As tokens are received, the `TokenSpeedEngine` updates the current token count and calculates the rolling TPS.
4.  **Display Updates**: The `Renderer` periodically updates the status bar with the current speed, token count, and color-coded indicators.
5.  **Completion**: Once the stream finishes, the engine calculates the final TPS based on your `endTpsBehavior` and displays it.

## Display Modes Explained

- **TPS**: Shows the current tokens per second and the total token count.
- **TTFT**: Specifically highlights the Time to First Token, showing how long it took for the model to start responding.
- **Stats**: Provides a breakdown of total tokens and total time.
- **Full**: A comprehensive display showing TTFT, current TPS, and total tokens.
