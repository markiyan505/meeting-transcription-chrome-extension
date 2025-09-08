export interface ExtensionState {
  isActive: boolean;
  currentTab?: chrome.tabs.Tab;
  settings: {
    theme: "light" | "dark";
    autoOpen: boolean;
  };
}

export interface FloatPanelState {
  isVisible: boolean;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
}

export type Theme = "light" | "dark";
