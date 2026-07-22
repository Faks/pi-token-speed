import { describe, expect, it } from "vitest";
import { Validator } from "../src/validation";

describe("Validator", () => {
  describe("isValidHex", () => {
    it("accepts valid hex colors", () => {
      expect(Validator.isValidHex("#ff0000")).toBe(true);
      expect(Validator.isValidHex("#00ff00")).toBe(true);
      expect(Validator.isValidHex("#0000ff")).toBe(true);
      expect(Validator.isValidHex("#ffffff")).toBe(true);
      expect(Validator.isValidHex("#000000")).toBe(true);
      expect(Validator.isValidHex("#AbCdEf")).toBe(true);
      expect(Validator.isValidHex("#aBcDeF")).toBe(true);
    });

    it("rejects invalid hex colors", () => {
      expect(Validator.isValidHex("ff0000")).toBe(false); // missing #
      expect(Validator.isValidHex("#f00")).toBe(false); // 3 chars
      expect(Validator.isValidHex("#ff000")).toBe(false); // 5 chars
      expect(Validator.isValidHex("#ff00000")).toBe(false); // 7 chars
      expect(Validator.isValidHex("#gggggg")).toBe(false); // invalid chars
      expect(Validator.isValidHex("")).toBe(false);
      expect(Validator.isValidHex("#xyzxyz")).toBe(false);
      expect(Validator.isValidHex("#12345")).toBe(false);
      expect(Validator.isValidHex("random")).toBe(false);
    });
  });

  describe("validate — display mode", () => {
    it("accepts valid display modes", () => {
      for (const mode of ["tps", "ttft", "stats", "full"] as const) {
        const { config } = Validator.validate({
          ...getDefaultConfig(),
          display: mode,
        });
        expect(config.display).toBe(mode);
      }
    });

    it("defaults to 'tps' for invalid display mode", () => {
      const { config, errors } = Validator.validate({
        ...getDefaultConfig(),
        display: "invalid" as any,
      });
      expect(config.display).toBe("tps");
      expect(errors.some((e) => e.includes("Invalid display"))).toBe(true);
    });
  });

  describe("validate — count strategy", () => {
    it("accepts valid count strategies", () => {
      for (const strategy of ["estimate", "direct"] as const) {
        const { config } = Validator.validate({
          ...getDefaultConfig(),
          countStrategy: strategy,
        });
        expect(config.countStrategy).toBe(strategy);
      }
    });

    it("defaults to 'direct' for invalid count strategy", () => {
      const { config, errors } = Validator.validate({
        ...getDefaultConfig(),
        countStrategy: "invalid" as any,
      });
      expect(config.countStrategy).toBe("direct");
      expect(errors.some((e) => e.includes("Invalid countStrategy"))).toBe(true);
    });
  });

  describe("validate — useProviderTokens", () => {
    it("accepts boolean values", () => {
      const { config: c1 } = Validator.validate({
        ...getDefaultConfig(),
        useProviderTokens: true,
      });
      expect(c1.useProviderTokens).toBe(true);

      const { config: c2 } = Validator.validate({
        ...getDefaultConfig(),
        useProviderTokens: false,
      });
      expect(c2.useProviderTokens).toBe(false);
    });

    it("defaults to false for non-boolean values", () => {
      const { config, errors } = Validator.validate({
        ...getDefaultConfig(),
        useProviderTokens: "true" as any,
      });
      expect(config.useProviderTokens).toBe(false);
      expect(errors.some((e) => e.includes("Invalid useProviderTokens"))).toBe(true);
    });
  });

  describe("validate — slidingWindow", () => {
    it("accepts valid sliding window values", () => {
      for (const ms of [100, 500, 1000, 5000, 30000]) {
        const { config } = Validator.validate({
          ...getDefaultConfig(),
          slidingWindow: ms,
        });
        expect(config.slidingWindow).toBe(ms);
      }
    });

    it("defaults for out-of-range values", () => {
      const { config, errors } = Validator.validate({
        ...getDefaultConfig(),
        slidingWindow: 50, // below MIN (100)
      });
      expect(config.slidingWindow).toBe(1000);
      expect(errors.some((e) => e.includes("Invalid slidingWindow"))).toBe(true);
    });

    it("defaults for non-number values", () => {
      const { config, errors } = Validator.validate({
        ...getDefaultConfig(),
        slidingWindow: "abc" as any,
      });
      expect(config.slidingWindow).toBe(1000);
      expect(errors.some((e) => e.includes("Invalid slidingWindow"))).toBe(true);
    });
  });

  describe("validate — endTpsBehavior", () => {
    it("accepts valid endTpsBehavior values", () => {
      for (const behavior of ["average", "last"] as const) {
        const { config } = Validator.validate({
          ...getDefaultConfig(),
          endTpsBehavior: behavior,
        });
        expect(config.endTpsBehavior).toBe(behavior);
      }
    });

    it("defaults to 'average' for invalid behavior", () => {
      const { config, errors } = Validator.validate({
        ...getDefaultConfig(),
        endTpsBehavior: "invalid" as any,
      });
      expect(config.endTpsBehavior).toBe("average");
      expect(errors.some((e) => e.includes("Invalid endTpsBehavior"))).toBe(true);
    });
  });

  describe("validate — threshold order", () => {
    it("accepts valid ascending thresholds", () => {
      const { config, errors } = Validator.validate({
        ...getDefaultConfig(),
        tpsSlow: 0,
        tpsMedium: 15,
        tpsFast: 30,
        tpsBlazing: 45,
      });
      expect(errors.some((e) => e.includes("ascending"))).toBe(false);
      expect(config.tpsSlow).toBe(0);
      expect(config.tpsMedium).toBe(15);
      expect(config.tpsFast).toBe(30);
      expect(config.tpsBlazing).toBe(45);
    });

    it("reports error for non-ascending thresholds", () => {
      const { config, errors } = Validator.validate({
        ...getDefaultConfig(),
        tpsSlow: 50,
        tpsMedium: 30,
        tpsFast: 20,
        tpsBlazing: 10,
      });
      expect(errors.some((e) => e.includes("ascending"))).toBe(true);
      // Values should not be corrected — only defaults correct
      expect(config.tpsSlow).toBe(50);
      expect(config.tpsMedium).toBe(30);
    });
  });

  describe("validate — color definitions", () => {
    it("accepts valid color definitions", () => {
      const { config, errors } = Validator.validate({
        ...getDefaultConfig(),
        colorSlow: "#ff0000",
        colorMedium: "#00ff00",
        colorFast: "#0000ff",
        colorBlazing: "#ffffff",
      });
      expect(errors.some((e) => e.includes("Invalid color"))).toBe(false);
    });

    it("reports error for invalid color definitions", () => {
      const { config, errors } = Validator.validate({
        ...getDefaultConfig(),
        colorSlow: "not-a-color",
        colorMedium: "#gggggg",
        colorFast: "#fff",
        colorBlazing: "also-invalid",
      });
      expect(errors.some((e) => e.includes("Invalid colorSlow"))).toBe(true);
      expect(errors.some((e) => e.includes("Invalid colorMedium"))).toBe(true);
      expect(errors.some((e) => e.includes("Invalid colorFast"))).toBe(true);
      expect(errors.some((e) => e.includes("Invalid colorBlazing"))).toBe(true);
    });
  });

  describe("validate — full config", () => {
    it("returns clean config for all valid values", () => {
      const { config, errors } = Validator.validate({
        display: "full",
        tpsSlow: 0,
        tpsMedium: 10,
        tpsFast: 20,
        tpsBlazing: 30,
        colorSlow: "#ff4444",
        colorMedium: "#ffaa00",
        colorFast: "#00ff88",
        colorBlazing: "#44ddff",
        slidingWindow: 2000,
        useProviderTokens: true,
        countStrategy: "estimate",
        endTpsBehavior: "last",
      });
      expect(errors).toHaveLength(0);
      expect(config.display).toBe("full");
      expect(config.slidingWindow).toBe(2000);
      expect(config.useProviderTokens).toBe(true);
      expect(config.countStrategy).toBe("estimate");
      expect(config.endTpsBehavior).toBe("last");
    });

    it("corrects invalid values and returns defaults", () => {
      const { config, errors } = Validator.validate({
        display: "invalid" as any,
        tpsSlow: 100,
        tpsMedium: 50,
        tpsFast: 25,
        tpsBlazing: 10,
        colorSlow: "bad",
        colorMedium: "bad",
        colorFast: "bad",
        colorBlazing: "bad",
        slidingWindow: -1,
        useProviderTokens: "yes" as any,
        countStrategy: "wrong" as any,
        endTpsBehavior: "wrong" as any,
      });

      expect(config.display).toBe("tps");
      expect(config.countStrategy).toBe("direct");
      expect(config.useProviderTokens).toBe(false);
      expect(config.slidingWindow).toBe(1000);
      expect(config.endTpsBehavior).toBe("average");
      // Thresholds and colors are not corrected, only reported
      expect(config.tpsSlow).toBe(100);
    });
  });
});

function getDefaultConfig() {
  return {
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
}
