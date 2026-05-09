import type {
  ExtensionAPI,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";

import { TokenSpeedEngine } from "./engine";
import { renderStatus } from "./ui";

export default (pi: ExtensionAPI) => {
  const engine = new TokenSpeedEngine();

  pi.on("session_start", async (_, ctx: ExtensionContext) => {
    renderStatus(ctx);
  });

  pi.on("message_start", async (event) => {
    if (event.message?.role === "assistant") {
      engine.start();
    }
  });

  pi.on("message_update", async (event, ctx: ExtensionContext) => {
    const ev = event.assistantMessageEvent;
    if (ev.type === "text_delta" || ev.type === "thinking_delta") {
      engine.recordToken();
      renderStatus(ctx, engine.tps, engine.tokenCount, engine.elapsedSeconds);
    }
  });

  pi.on("message_end", async (event, ctx: ExtensionContext) => {
    if (event.message?.role !== "assistant" || !engine.isStreaming) return;
    engine.stop();

    renderStatus(ctx, engine.tps_avg, engine.tokenCount, engine.elapsedSeconds);
  });

  pi.on("turn_end", async () => {
    if (engine.isStreaming) {
      engine.stop();
    }
  });

  pi.on("session_shutdown", async () => {
    engine.stop();
  });
};
