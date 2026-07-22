import { describe, expect, it } from "vitest";
import  { TokenSpeedEngine } from "@pi-token-speed/Core/engine";

const MOCK_CONFIG = {
  slidingWindow: 1000,
  countStrategy: "direct" as const,
  useProviderTokens: false,
  endTpsBehavior: "average" as const,
};

describe("Performance Benchmark", () => {
  it("records 10,000 tokens quickly", async () => {
    const engine = new TokenSpeedEngine();
    engine.initialize(MOCK_CONFIG);

    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      engine.recordDelta("test");
    }
    const end = performance.now();
    const duration = end - start;

    console.log(`Time to record 10,000 records: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(500); // Should be very fast
  });
});
