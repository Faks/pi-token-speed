import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { getSettingsListTheme } from "@earendil-works/pi-coding-agent";
import { SettingsList, type SettingItem } from "@earendil-works/pi-tui";
import type {
  CountStrategy,
  DisplayMode,
  TokenSpeedConfig,
} from "./config-types";
import {
  COUNT_STRATEGY_LABELS,
  DISPLAY_LABELS,
  TOGGLE_LABELS,
} from "./options";
import type { Renderer } from "./renderer";
import { settings } from "./settings";

/**
 * Handles commands for the token-speed extension.
 */
export class CommandManager {
  constructor(private readonly renderer: Renderer) {}

  /**
   * Handles the `/tps` command — opens a SettingsList to configure
   * display mode, token counting strategy, and provider token usage.
   *
   * @param ctx The context used by Pi
   */
  async runTps(ctx: ExtensionCommandContext): Promise<void> {
    const config = settings.getConfig();
    const items = this.buildSettingsItems(config);

    await ctx.ui.custom<void>((_tui, _theme, _kb, done) =>
      this.createSettingsList(
        items,
        async (id, newValue) => this.handleSettingChange(id, newValue, ctx),
        done,
      ),
    );

    // Re-render with the latest config
    this.renderer.update(ctx);
  }

  /**
   * Handles a settings value change — writes the new value and re-renders.
   *
   * @param id The setting identifier
   * @param newValue The new value to apply
   * @param ctx The context used by Pi
   */
  private async handleSettingChange(
    id: string,
    newValue: string,
    ctx: ExtensionCommandContext,
  ): Promise<void> {
    if (id === "display") {
      await settings.setConfig({ display: newValue as DisplayMode });
    } else if (id === "useProviderTokens") {
      await settings.setConfig({ useProviderTokens: newValue === "on" });
    } else if (id === "countStrategy") {
      await settings.setConfig({
        countStrategy: newValue as CountStrategy,
      });
    }
    this.renderer.update(ctx);
  }

  /**
   * Creates the SettingsList for the token speed settings menu.
   *
   * @param items The settings items to display
   * @param onChange Callback when a setting value changes
   * @param onClose Callback when the dialog closes
   * @returns The configured SettingsList instance
   */
  private createSettingsList(
    items: SettingItem[],
    onChange: (id: string, newValue: string) => void,
    onClose: () => void,
  ): SettingsList {
    return new SettingsList(
      items,
      items.length,
      getSettingsListTheme(),
      onChange,
      onClose,
    );
  }

  /**
   * Builds the SettingsList items for the token speed settings menu.
   *
   * @param config The resolved configuration
   * @returns The array of SettingItem objects
   */
  private buildSettingsItems(config: TokenSpeedConfig): SettingItem[] {
    return [
      {
        id: "display",
        label: "Display mode",
        description: "Level of detail to show in the status bar",
        currentValue: config.display,
        values: Object.keys(DISPLAY_LABELS) as DisplayMode[],
      },
      {
        id: "useProviderTokens",
        label: "Use provider tokens",
        description:
          "Use the provider's token count instead of this extension's counter",
        currentValue: config.useProviderTokens ? "on" : "off",
        values: Object.keys(TOGGLE_LABELS),
      },
      {
        id: "countStrategy",
        label: "Count strategy",
        description:
          "Direct counting (server streams tokens) vs estimate counting (server streams chunks)",
        currentValue: config.countStrategy,
        values: Object.keys(COUNT_STRATEGY_LABELS) as CountStrategy[],
      },
    ];
  }
}
