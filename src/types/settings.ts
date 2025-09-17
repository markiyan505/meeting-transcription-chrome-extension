/**
 * Типи для налаштувань розширення
 */

export enum Theme {
  LIGHT = "light",
  DARK = "dark",
}

export type SettingsConfig = {
  startSessionSettings: StartSessionSettings;
  generalSettings: GeneralSettings;
};

export type StartSessionSettings = {
  isFloatingPanelVisible: boolean;
};

export type GeneralSettings = {
  isExtensionEnabled: boolean;
  maxHistorySize: number;
};
