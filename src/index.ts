/**
 * Runtime bootstrap: register tsconfig-paths so Node.js can resolve
 * `@pi-token-speed/*` aliases before any project imports are loaded.
 *
 * Because tsconfig.json uses "module": "commonjs", TypeScript compiles
 * these top-to-bottom `import` statements into sequential `require()`
 * calls — the register() call runs before the first aliased import.
 */
import { register } from "tsconfig-paths";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
register({
  baseUrl: __dirname,
  paths: {
    "@pi-token-speed/*": ["./src/*"],
  },
});

import type {
  AgentEndEvent,
  ExtensionAPI,
  ExtensionCommandContext,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";

import { CommandManager } from "@pi-token-speed/Commands/commands";
import { TokenSpeedEngine } from "@pi-token-speed/Core/engine";
import { EventManager } from "@pi-token-speed/Core/events";
import { Renderer } from "@pi-token-speed/UI/renderer";

export default async (pi: ExtensionAPI) => {
  const engine = new TokenSpeedEngine();
  const renderer = new Renderer(engine);
  const commands = new CommandManager(renderer, engine);
  const eventManager = new EventManager(engine, renderer);

  // Command registration
  pi.registerCommand("tps", {
    description:
      "Open settings menu to configure display mode, token counting strategy, and provider token usage",
    handler: (_, ctx: ExtensionCommandContext) => commands.runTps(ctx),
  });

  // Session lifecycle
  pi.on("session_start", async (_, ctx: ExtensionContext) => {
    await eventManager.handleSessionStart(ctx);
  });

  pi.on("session_shutdown", () => {
    eventManager.handleSessionShutdown();
  });

  // Streaming lifecycle
  pi.on("message_start", (event) => {
    eventManager.handleMessageStart(event);
  });

  pi.on("message_update", (event, ctx: ExtensionContext) => {
    eventManager.handleMessageUpdate(event, ctx);
  });

  pi.on("agent_end", (event: AgentEndEvent, ctx: ExtensionContext) => {
    eventManager.handleAgentEnd(event, ctx);
  });
};
