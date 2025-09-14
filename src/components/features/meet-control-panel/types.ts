export type orientationType = "vertical" | "horizontal";
export type stateType = "idle" | "recording" | "paused";
export type errorType =
  | undefined
  | "not_authorized"
  | "subtitles_disabled"
  | "incorrect_language";

export interface PanelState {
  state: stateType;
  error: errorType;
  panelOrientation: orientationType;
  isCollapsed: boolean;
  isSubtitlesEnabled: boolean;
}

export interface PanelActions {
  setState: (state: stateType) => void;
  setError: (error: errorType) => void;
  setPanelOrientation: (orientation: orientationType) => void;
  setIsCollapsed: (collapsed: boolean) => void;
  setIsSubtitlesEnabled: (enabled: boolean) => void;
}

export interface StatusConfig {
  bg: string;
  title: string;
}
