import { beforeEach, describe, expect, it, vi } from "vitest";
import { TokenSpeedEngine } from "../src/engine";
import { Renderer } from "../src/renderer";
import { EventManager } from "../src/events";

// Mock settings
vi.mock("../src/settings", () => ({
  settings: {
    initialize: vi.fn().mockResolvedValue(undefined),
    getErrors: vi.fn().mockReturnValue([]),
    getConfig: () => ({
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
    }),
  },
}));

// Mock renderer
vi.mock("../src/renderer", () => {
  class MockRenderer {
    initialize() {}
    update() {}
  }
  return { Renderer: MockRenderer };
});

describe("EventManager", () => {
  let engine: TokenSpeedEngine;
  let renderer: Renderer;
  let manager: EventManager;

  beforeEach(() => {
    engine = new TokenSpeedEngine();
    engine.initialize();
    renderer = new Renderer(engine);
    manager = new EventManager(engine, renderer);
  });

  describe("handleAgentEnd", () => {
    it("reconciles total from messages with usage", () => {
      const mockCtx = { ui: { notify: vi.fn(), setStatus: vi.fn() } };
      const event = {
        messages: [
          { usage: { output: 10 } },
          { usage: { output: 20 } },
          { content: "no usage here" },
        ],
      } as unknown as import("@earendil-works/pi-coding-agent").AgentEndEvent;

      manager.handleAgentEnd(event, mockCtx as any);
      expect(engine.tokenCount).toBe(30);
    });

    it("handles messages without usage gracefully", () => {
      const mockCtx = { ui: { notify: vi.fn(), setStatus: vi.fn() } };
      const event = {
        messages: [
          { content: "no usage" },
          { content: "also no usage" },
        ],
      } as unknown as import("@earendil-works/pi-coding-agent").AgentEndEvent;

      manager.handleAgentEnd(event, mockCtx as any);
      expect(engine.tokenCount).toBe(0);
    });

    it("handles null/undefined usage fields", () => {
      const mockCtx = { ui: { notify: vi.fn(), setStatus: vi.fn() } };
      const event = {
        messages: [
          { usage: null },
          { usage: undefined },
          { content: "no usage key" },
        ],
      } as unknown as import("@earendil-works/pi-coding-agent").AgentEndEvent;

      // Should not throw — the fix guards against undefined usage.output
      expect(() => {
        manager.handleAgentEnd(event, mockCtx as any);
      }).not.toThrow();
    });

    it("stops streaming on agent end", () => {
      engine.start();
      const mockCtx = { ui: { notify: vi.fn(), setStatus: vi.fn() } };
      const event = {
        messages: [{ usage: { output: 5 } }],
      } as unknown as import("@earendil-works/pi-coding-agent").AgentEndEvent;

      manager.handleAgentEnd(event, mockCtx as any);
      expect(engine.isStreaming).toBe(false);
    });
  });

  describe("handleMessageStart", () => {
    it("starts TTFT for user messages", () => {
      manager.handleMessageStart({ message: { role: "user" } });
      expect(engine.ttft).toBeGreaterThanOrEqual(0);
    });

    it("does not start TTFT for assistant messages", () => {
      manager.handleMessageStart({ message: { role: "assistant" } });
      // TTFT should be 0 since we never called startTTFT
      expect(engine.ttft).toBe(0);
    });
  });

  describe("handleSessionShutdown", () => {
    it("stops the engine", () => {
      engine.start();
      manager.handleSessionShutdown();
      expect(engine.isStreaming).toBe(false);
    });
  });
});
