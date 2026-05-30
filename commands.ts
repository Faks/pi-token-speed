import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { setConfig } from "./config";
import { readUserSettings } from "./settings";

export const tpsCommand = async (
  _args: string,
  ctx: ExtensionCommandContext,
) => {
  const { display: oldDisplay = "tps" } = readUserSettings();
  const display: "tps" | "full" = oldDisplay === "full" ? "tps" : "full";

  setConfig({ display });
  ctx.ui.notify(`[pi-token-speed] Display mode → ${display}`, "info");
};
