export type orientationType = "vertical" | "horizontal";
export type stateType = "idle" | "recording" | "paused";
export type errorType =
  | undefined
  | "not_authorized"
  | "subtitles_disabled"
  | "incorrect_language"
  | "unknown_error";


export interface LocalPanelState {
  panelOrientation: orientationType;
  isCollapsed: boolean;
}

export interface StatusConfig {
  bg: string;
  title: string;
}
