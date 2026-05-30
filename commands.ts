import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { setConfig } from "./config";
import { readUserSettings } from "./settings";
import { renderStatus } from "./ui";

export const tpsCommand = async (ctx: ExtensionCommandContext, engine: any) => {
  const { display: oldDisplay = "tps" } = readUserSettings();
  const display: "tps" | "full" = oldDisplay === "full" ? "tps" : "full";

  setConfig({ display });
  renderStatus(ctx, engine);

  ctx.ui.notify(`[pi-token-speed] Display mode → ${display}`, "info");
};
