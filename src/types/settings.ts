/**
 * Типи для налаштувань розширення
 */

export enum Theme {
  LIGHT = "light",
  DARK = "dark",
}

export type SettingsConfig = {
  extensionActive: boolean;
  // theme: Theme;
  // autoOpen: boolean;
  floatPanelVisible: boolean;
  maxHistorySize: number;
  // autoSave: boolean;
  // notificationSound: boolean;
};
