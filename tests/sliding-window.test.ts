import { describe, expect, it, vi } from "vitest";
import { SlidingWindow } from "../src/Core/sliding-window";

describe("SlidingWindow", () => {
  const WINDOW_MS = 1000;

  it("returns 0 when empty", () => {
    const w = new SlidingWindow(WINDOW_MS);
    expect(w.getTps(Date.now())).toBe(0);
  });

  it("records tokens and returns TPS", () => {
    const w = new SlidingWindow(WINDOW_MS);
    const now = Date.now();

    w.record(10);
    expect(w.getTps(now + 500)).toBeGreaterThan(0);

    w.record(10);
    const tps = w.getTps(now + 500);
    // 20 tokens in ~500ms → ~40 TPS
    expect(tps).toBeGreaterThan(30);
    expect(tps).toBeLessThan(50);
  });

  it("excludes events outside the window", () => {
    const w = new SlidingWindow(WINDOW_MS);
    const now = Date.now();

    w.record(10);
    // Query far in the future — old event should be excluded
    expect(w.getTps(now + 5000)).toBe(0);
  });

  it("clamps minimum span to avoid burst spikes", () => {
    const w = new SlidingWindow(WINDOW_MS);
    const now = Date.now();

    w.record(10);
    // Same timestamp — span would be 0, clamped to MIN_SLIDING_WINDOW (100ms)
    const tps = w.getTps(now);
    // 10 tokens / 0.1s = 100 TPS (minimum span)
    expect(tps).toBeCloseTo(100, 0);
  });

  it("reset clears all state", () => {
    const w = new SlidingWindow(WINDOW_MS);
    w.record(10);
    w.reset();
    expect(w.getTps(Date.now())).toBe(0);
  });

  it("compacts events after reaching threshold", () => {
    const w = new SlidingWindow(WINDOW_MS);
    // COMPACTION_THRESHOLD = 5000
    for (let i = 0; i < 5000; i++) {
      w.record(1);
    }
    // We can't directly access private events, but we can verify TPS still works
    const tps = w.getTps(Date.now());
    expect(tps).toBeGreaterThan(0);
  });

  it("handles zero token records gracefully", () => {
    const w = new SlidingWindow(WINDOW_MS);
    const now = Date.now();

    w.record(0);
    expect(w.getTps(now)).toBe(0);

    w.record(5);
    w.record(0);
    expect(w.getTps(now + 100)).toBeGreaterThan(0);
  });

  it("calculates TPS within the window accurately", () => {
    const w = new SlidingWindow(WINDOW_MS);
    const now = Date.now();

    w.record(5);
    // 5 tokens in ~100ms → ~50 TPS
    const tps = w.getTps(now + 100);
    expect(tps).toBeGreaterThan(40);
    expect(tps).toBeLessThan(60);
  });

  it("uses events within window for TPS calculation", () => {
    const w = new SlidingWindow(WINDOW_MS);
    const now = Date.now();

    w.record(10);
    w.record(10);
    w.record(10);

    const tps = w.getTps(now + 500);
    // 30 tokens in ~500ms → ~60 TPS
    expect(tps).toBeGreaterThan(50);
    expect(tps).toBeLessThan(70);
  });
});
