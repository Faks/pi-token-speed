import type {
  ExtensionAPI,
  ExtensionContext,
  ExtensionUIContext,
} from "@earendil-works/pi-coding-agent";

import { tpsCommand } from "./commands";
import { getConfig } from "./config";
import { TokenSpeedEngine } from "./engine";
import { renderStatus } from "./ui";

/**
 * Setup and validation utilities for the token-speed extension.
 * Handles one-time initialization during session start.
 *
 * @param uiHandler The Pi UI handler for displaying notifications and status updates.
 */
export function initialize(uiHandler: ExtensionUIContext): void {
  const { errors } = getConfig();
  if (errors.length === 0) return;

  const message = errors.join("\n");
  uiHandler?.notify(message, "warning");
}

export default (pi: ExtensionAPI) => {
  const engine = new TokenSpeedEngine();

  pi.registerCommand("tps", {
    description: "Toggle display mode between 'tps' and 'full'",
    handler: tpsCommand,
  });

  pi.on("session_start", async (_, ctx: ExtensionContext) => {
    initialize(ctx.ui);
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
