# Troubleshooting

## Common Issues

### Status Bar Not Showing

**Symptom:** The status bar doesn't display `⚡ TPS: --` when a session starts.

**Solution:**

1. Verify the extension is installed: `pi list`
2. Check that Pi is running and connected to your server
3. Run `/tps` to trigger the interactive menu — if it works, the extension is loaded
4. Restart Pi to reload the extension

### TPS Shows `--` Continuously

**Symptom:** The status bar shows `⚡ TPS: --` even when the AI is streaming.

**Solution:**

1. Verify the AI is actually streaming (check the main chat area)
2. Check for configuration errors in `~/.pi/agent/settings.json`
3. Look for warning notifications at session start — invalid configuration may prevent the engine from initializing
4. Restart the session

### TPS Values Seem Incorrect

**Symptom:** TPS readings don't match expected performance.

**Solutions:**

| Cause                          | Solution                                                        |
| ------------------------------ | --------------------------------------------------------------- |
| Sliding window too small       | Increase `slidingWindow` to `3000` or higher                    |
| Sliding window too large       | Decrease `slidingWindow` to `500` for faster response           |
| Provider tokens disabled       | Enable `useProviderTokens: true` if your provider reports counts |
| Count strategy mismatch        | Try `estimate` if streaming in small chunks                     |
| Tool processing skewing TPS    | This is expected — the timer pauses for prompt processing tools |

### Configuration Not Taking Effect

**Symptom:** Changes to `~/.pi/agent/settings.json` don't take effect.

**Solution:**

1. Ensure the file is valid JSON
2. Verify the `tokenSpeed` key is at the root level
3. Restart Pi to reload configuration
4. Check for warning notifications at session start

### Invalid Configuration Warnings

**Symptom:** A warning notification appears at session start listing corrections.

**Solution:**

The extension automatically corrects invalid values. Review the warning message to identify which options need fixing:

```
[pi-token-speed]
- Invalid display "invalid" — defaulting to "tps".
- TPS thresholds must be in ascending order.
  Found: 30 < 15 < 45 < 60.
```

Common corrections:

| Warning                                         | Fix                                           |
| ----------------------------------------------- | --------------------------------------------- |
| `Invalid display "..." — defaulting to "tps"`   | Use `tps`, `ttft`, `stats`, or `full`         |
| `Invalid countStrategy "..." — defaulting to "direct"` | Use `estimate` or `direct`              |
| `Invalid useProviderTokens (expected boolean)`  | Use `true` or `false`                         |
| `Invalid slidingWindow "..." — defaulting to 1000` | Use a number between 100 and 30000        |
| `Invalid endTpsBehavior "..." — defaulting to "average"` | Use `average` or `last`               |
| `TPS thresholds must be in ascending order`     | Ensure `tpsSlow < tpsMedium < tpsFast < tpsBlazing` |
| `Invalid colorSlow/Medium/Fast/Blazing`         | Use valid 24-bit hex strings (`#RRGGBB`)      |

### Sliding Window Too Small

**Symptom:** TPS values spike erratically or show `Infinity`.

**Solution:** The minimum span is clamped to `100ms` to prevent burst spikes. If you're seeing extremely high values, increase the sliding window:

```json
{
  "tokenSpeed": {
    "slidingWindow": 3000
  }
}
```

### Provider Token Counts Not Working

**Symptom:** `useProviderTokens: true` doesn't seem to affect TPS values.

**Solution:**

1. Verify your provider actually reports token counts (check provider documentation)
2. The extension falls back to `countStrategy` when provider counts are unavailable
3. Check that the provider's reported counts are higher than the extension's counter (the extension uses the maximum of the two)

### Timer Pausing Causing Gaps

**Symptom:** TPS values drop unexpectedly during tool usage.

**Solution:** This is expected behavior. The extension pauses the timer for prompt processing tools (anything other than `edit`/`write`). The timer resumes when the next token delta arrives. This prevents tool processing time from skewing the TPS calculation.

## Debugging

### Check Configuration

Verify your settings are loaded correctly:

```bash
# Check settings file
cat ~/.pi/agent/settings.json
```

Look for the `tokenSpeed` section:

```json
{
  "tokenSpeed": {
    "slidingWindow": 1000,
    "display": "tps",
    "useProviderTokens": false,
    "countStrategy": "direct",
    "endTpsBehavior": "average"
  }
}
```

### Verify Server Connection

Test your server directly:

```bash
# Health check
curl http://127.0.0.1:8080/health

# List models
curl http://127.0.0.1:8080/v1/models

# Get model props
curl http://127.0.0.1:8080/props?model=your-model.gguf&autoload=false
```

### Check Pi Logs

Check Pi's logs for extension errors:

```bash
cat ~/.pi/agent/logs/*.log | grep -i "token"
```

### Test Interactive Menu

Run `/tps` in Pi to verify the extension is loaded and responsive. If the menu opens, the extension is working correctly.

## Getting Help

If you're still stuck:

1. Check the [GitHub Issues](https://github.com/faks/pi-token-speed/issues) for similar problems
2. Include your configuration (redact any sensitive data) and server logs when asking for help
3. Mention your Pi version and extension version (check `package.json` for version)
