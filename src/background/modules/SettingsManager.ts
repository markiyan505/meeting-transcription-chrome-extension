/**
 * SettingsManager - manages extension settings
 */

import type { SettingsConfig } from "../../types/settings";
import { Theme } from "../../types/settings";

export class SettingsManager {
  /**
   * Factory for creating default settings
   */
  static createDefaultSettings(): SettingsConfig {
    return {
      startSessionSettings: {
        isFloatingPanelVisible: true,
      },
      generalSettings: {
        isExtensionEnabled: true,
        maxHistorySize: 50,
      },
    };
  }

  /**
   * Validation functions with type guards
   */
  private static readonly CRITICAL_VALIDATORS = {
    theme: (value: any): value is Theme =>
      typeof value === "string" &&
      (Object.values(Theme) as string[]).includes(value),
    maxHistorySize: (value: any): value is number =>
      typeof value === "number" && value > 0 && value <= 1000,
  } as const;

  /**
   * Initializes settings on extension install/update
   */
  static async initializeSettings(reason: string): Promise<void> {
    const defaultSettings = this.createDefaultSettings();

    if (reason === "install") {
      console.log("First installation - setting default settings");
      await chrome.storage.local.set(defaultSettings);
      return;
    }

    if (reason === "update") {
      console.log("Extension updated - preserving existing settings");

      const existingSettings = await chrome.storage.local.get(
        Object.keys(defaultSettings)
      );
      const settingsToUpdate: Partial<SettingsConfig> = {};

      for (const [key, defaultValue] of Object.entries(defaultSettings)) {
        const settingKey = key as keyof SettingsConfig;
        const existingValue = existingSettings[settingKey];

        if (existingValue === undefined) {
          (settingsToUpdate as any)[settingKey] = defaultValue;
          console.log(`Missing setting ${key}: -> ${defaultValue}`);
          continue;
        }

        if (settingKey in this.CRITICAL_VALIDATORS) {
          const validator =
            this.CRITICAL_VALIDATORS[
              settingKey as keyof typeof this.CRITICAL_VALIDATORS
            ];
          if (!validator(existingValue)) {
            (settingsToUpdate as any)[settingKey] = defaultValue;
            console.log(
              `Invalid setting ${key}: ${existingValue} -> ${defaultValue}`
            );
          }
        }
      }

      if (Object.keys(settingsToUpdate).length > 0) {
        await chrome.storage.local.set(settingsToUpdate);
        console.log("Updated settings:", settingsToUpdate);
      } else {
        console.log("All settings are valid - no changes needed");
      }
    }
  }

  /**
   * Gets the current settings
   */
  static async getSettings(): Promise<SettingsConfig> {
    const defaultSettings = this.createDefaultSettings();
    const settings = await chrome.storage.local.get(
      Object.keys(defaultSettings)
    );

    return {
      ...defaultSettings,
      ...settings,
    } as SettingsConfig;
  }

  /**
   * Updates the settings
   */
  static async updateSettings(
    settings: Partial<SettingsConfig>
  ): Promise<void> {
    await chrome.storage.local.set(settings);
  }

  /**
   * Toggles the extension state
   */
  // static async toggleExtensionState(): Promise<boolean> {
  //   console.log("[SETTINGS MANAGER] Toggling extension state");
  //   const settings = await this.getSettings();
  //   const newState = !settings.generalSettings.isExtensionEnabled;
  //   console.log("[SETTINGS MANAGER] New extension state:", newState);
  //   await this.updateSettings({
  //     generalSettings: {
  //       isExtensionEnabled: newState,
  //       maxHistorySize: settings.generalSettings.maxHistorySize,
  //     },
  //   });
  //   return newState;
  // }

  /**
   * Toggles the visibility of the panel
   */
  static async toggleFloatPanelVisibility(): Promise<boolean> {
    const settings = await this.getSettings();
    const newState = !settings.startSessionSettings.isFloatingPanelVisible;
    await this.updateSettings({
      startSessionSettings: { isFloatingPanelVisible: newState },
    });
    return newState;
  }
}
