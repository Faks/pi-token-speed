# Performance & Benchmarks

This page details the performance characteristics and algorithmic choices made to ensure the extension remains highly responsive during high-throughput token streaming.

## Sliding Window Algorithm

The extension uses a time-based sliding window to calculate Tokens Per Second (TPS).

### Complexity Analysis
- **Record Complexity:** $O(1)$. Each token record is a simple push to an array and an update to a running sum.
- **TPS Calculation Complexity:** $O(1)$. By maintaining a `runningSum` of tokens within the active window, we avoid iterating over the entire history of events for every status bar update.
- **Memory Complexity:** $O(N)$ where $N$ is the number of records within the compaction threshold.

### Memory Management: Compaction
To prevent unbounded memory growth in long-running sessions, the extension implements a **Compaction Threshold**. 
- When the internal event buffer reaches 5,000 records, the `compact()` method is called.
- This method removes "dead" records from the beginning of the array that have fallen outside the current sliding window, resetting the memory footprint.

## Benchmarks

We have performed internal benchmarking to verify the performance of the `SlidingWindow` implementation.

### Throughput Test
- **Operation:** Recording 10,000 discrete token deltas.
- **Result:** ~3ms total processing time.
- **Average per record:** ~0.0003ms.

These results indicate that the extension's overhead per token is negligible, ensuring that the status bar updates will not block or slow down the primary LLM streaming response.

## Optimization Notes
- **Lazy Calculation:** TPS is only recalculated when the renderer requests an update, rather than on every single token record.
- **Clamped Spans:** To prevent "burst spikes" (where a single token record with a very small time delta would result in an infinitely high TPS), we clamp the minimum span for calculation to 100ms.
