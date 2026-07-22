import { beforeEach, describe, expect, it, vi } from "vitest";
import { TokenSpeedEngine } from "./engine";
import { Renderer } from "./renderer";
import { settings } from "./settings";
import { Validator } from "./validation";

const MOCK_CONFIG = {
  tpsSlow: 0,
  tpsMedium: 15,
  tpsFast: 30,
  tpsBlazing: 45,
  colorSlow: "#ff4444",
  colorMedium: "#ffaa00",
  colorFast: "#00ff88",
  colorBlazing: "#44ddff",
  slidingWindow: 1000,
  display: "tps" as const,
  useProviderTokens: false,
  countStrategy: "direct" as const,
  endTpsBehavior: "average" as const,
};

// Mock settings
vi.mock("./settings", () => ({
  settings: {
    getConfig: () => MOCK_CONFIG,
  },
}));

describe("Renderer", () => {
  let engine: TokenSpeedEngine;
  let renderer: Renderer;

  beforeEach(() => {
    engine = new TokenSpeedEngine();
    engine.initialize();
    renderer = new Renderer(engine);
  });

  describe("Validator.isValidHex (used by Renderer.colorHex)", () => {
    it("validates hex colors correctly", () => {
      expect(Validator.isValidHex("#ff0000")).toBe(true);
      expect(Validator.isValidHex("#00ff00")).toBe(true);
      expect(Validator.isValidHex("#0000ff")).toBe(true);
      expect(Validator.isValidHex("#ffffff")).toBe(true);
      expect(Validator.isValidHex("#000000")).toBe(true);
      expect(Validator.isValidHex("#AbCdEf")).toBe(true);
    });

    it("rejects invalid hex colors", () => {
      expect(Validator.isValidHex("ff0000")).toBe(false);
      expect(Validator.isValidHex("#f00")).toBe(false);
      expect(Validator.isValidHex("#ff00000")).toBe(false);
      expect(Validator.isValidHex("#gggggg")).toBe(false);
      expect(Validator.isValidHex("")).toBe(false);
    });
  });

  describe("formatStats", () => {
    it("returns token count when elapsed is zero", () => {
      const formatStats = (renderer as unknown as Record<string, unknown>)
        .formatStats as (tokens: number, elapsed: number) => string;
      const result = formatStats(10, 0);
      expect(result).toBe("10 tok");
    });

    it("returns token count and elapsed when elapsed is positive", () => {
      const formatStats = (renderer as unknown as Record<string, unknown>)
        .formatStats as (tokens: number, elapsed: number) => string;
      const result = formatStats(10, 2.5);
      expect(result).toBe("10 tok in 2.5s");
    });

    it("formats elapsed to one decimal place", () => {
      const formatStats = (renderer as unknown as Record<string, unknown>)
        .formatStats as (tokens: number, elapsed: number) => string;
      const result = formatStats(10, 2.567);
      expect(result).toBe("10 tok in 2.6s");
    });

    it("handles zero tokens", () => {
      const formatStats = (renderer as unknown as Record<string, unknown>)
        .formatStats as (tokens: number, elapsed: number) => string;
      const result = formatStats(0, 5);
      expect(result).toBe("0 tok in 5.0s");
    });
  });

  describe("buildSuffix", () => {
    const getBuildSuffix = () =>
      ((renderer as unknown as Record<string, unknown>).buildSuffix as (
        mode: string,
      ) => string).bind(renderer);

    it("returns empty string for tps mode", () => {
      expect(getBuildSuffix()("tps")).toBe("\u200b");
    });

    it("returns TTFT suffix for ttft mode", () => {
      engine.start();
      engine.startTTFT();
      const result = getBuildSuffix()("ttft");
      expect(result).toContain("TTFT:");
      expect(result).toContain("ms");
      expect(result).toContain("\u200b");
    });

    it("returns stats suffix for stats mode", () => {
      engine.start();
      engine.recordDelta("hello");
      const result = getBuildSuffix()("stats");
      expect(result).toContain("tok");
      expect(result).toContain("\u200b");
    });

    it("returns full suffix for full mode", () => {
      engine.start();
      engine.startTTFT();
      engine.recordDelta("hello");
      const result = getBuildSuffix()("full");
      expect(result).toContain("tok");
      expect(result).toContain("TTFT:");
      expect(result).toContain("\u200b");
    });
  });

  describe("getColor", () => {
    const getGetColor = () =>
      ((renderer as unknown as Record<string, unknown>).getColor as (
        config: ReturnType<typeof settings.getConfig>,
        tps: number | null,
      ) => string).bind(renderer);

    it("returns empty string for null TPS", () => {
      expect(
        getGetColor()(settings.getConfig(), null as unknown as number),
      ).toBe("");
    });

    it("returns blazing color for TPS >= blazing threshold", () => {
      expect(getGetColor()(settings.getConfig(), 50)).toBe("#44ddff");
    });

    it("returns fast color for TPS >= fast threshold", () => {
      expect(getGetColor()(settings.getConfig(), 35)).toBe("#00ff88");
    });

    it("returns medium color for TPS >= medium threshold", () => {
      expect(getGetColor()(settings.getConfig(), 20)).toBe("#ffaa00");
    });

    it("returns slow color for TPS >= slow threshold", () => {
      expect(getGetColor()(settings.getConfig(), 5)).toBe("#ff4444");
    });

    it("returns empty string for TPS below slow threshold", () => {
      expect(getGetColor()(settings.getConfig(), -1)).toBe("");
    });
  });
});
