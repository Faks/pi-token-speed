# Configuration Guide

This guide explains how to manage, customize, and understand the configuration for the `pi-token-speed` extension.

## Configuration Overview

Configuration is managed through the `Settings` class located in `src/Config/settings.ts`. We use a **Factory Pattern** to instantiate settings, ensuring that each part of the extension can have its own isolated configuration if needed.

## The `Settings` Factory

Instead of accessing a global singleton, use the factory method to create a settings instance:

```typescript
import { settings } from "@pi-token-speed/Config/settings";

// For standard usage:
const config = await settings.initialize();
```

The `settings` object handles:
- **Defaults:** Loading the baseline values for thresholds, colors, and windows.
- **Persistence:** Automatically loading and saving user preferences to `~/.pi/agent/settings.json`.
- **Validation:** Ensuring that any configuration changes meet the required types and ranges.

## Configuration Schema

The following configuration keys are available:

| Key | Type | Default | Description |
|---|---|---|---|
| `tpsSlow` | `number` | `0` | TPS threshold for "Slow" color |
| `tpsMedium` | `number` | `15` | TPS threshold for "Medium" color |
| `tpsFast` | `number` | `30` | TPS threshold for "Fast" color |
| `tpsBlazing` | `number` | `45` | TPS threshold for "Blazing" color |
| `colorSlow` | `string` | `#ff4444` | Hex color for slow speeds |
| `colorMedium` | `string` | `#ffaa00` | Hex color for medium speeds |
| `colorFast` | `string` | `#00ff88` | Hex color for fast speeds |
| `colorBlazing` | `string` | `#44ddff` | Hex color for blazing speeds |
| `slidingWindow` | `number` | `1000` | The window size in milliseconds for TPS calculations |
| `display` | `string` | `tps` | Display mode (`tps`, `ttft`, `stats`, `full`) |
| `useProviderTokens` | `boolean` | `false` | Whether to use provider-provided token counts |
| `countStrategy` | `string` | `direct` | Strategy for counting (`direct`, `provider`) |
| `endTpsBehavior` | `string` | `average` | Behavior when streaming ends (`average`, `final`) |

## Constants

All hardcoded limits and defaults are consolidated in `src/constants.ts`.

- **Sliding Window Limits:**
    - `MIN_SLIDING_WINDOW`: 100ms
    - `MAX_SLIDING_WINDOW`: 30000ms
    - `COMPACTION_THRESHOLD`: 5000 (Number of records before compaction)

- **Validation Utilities:**
    - `isValidHex(s: string)`: A utility to validate 24-bit hex strings.
