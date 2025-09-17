/**
 * Типи для налаштувань розширення
 */

export enum Theme {
  LIGHT = "light",
  DARK = "dark",
}

export type SettingsConfig = {
  isExtensionEnabled: boolean;
  // theme: Theme;
  // autoOpen: boolean;
  isFloatingPanelVisible: boolean;
  maxHistorySize: number;
  // autoSave: boolean;
  // notificationSound: boolean;
};
