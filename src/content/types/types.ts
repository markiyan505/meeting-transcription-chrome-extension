// Panel configurations
export interface PanelConfig {
  PANEL_IDS: {
    CONTAINER: string;
    IFRAME: string;
    DRAG_HANDLE: string;
  };
  MIN_DIMENSIONS: {
    WIDTH: number;
    HEIGHT: number;
  };
  IFRAME_SRC: string;
  CSS_CLASSES: {
    container: string;
    iframe: string;
    dragHandle: string;
  };
  RESIZABLE: boolean;
}

export const CONTROL_PANEL: PanelConfig = {
  PANEL_IDS: {
    CONTAINER: "chrome-extension-float-panel-container",
    IFRAME: "chrome-extension-float-panel",
    DRAG_HANDLE: "chrome-extension-drag-handle",
  },
  MIN_DIMENSIONS: {
    WIDTH: 28,
    HEIGHT: 18,
  },
  IFRAME_SRC: "src/entries/floatpanel/index.html",
  CSS_CLASSES: {
    container: "control-panel-container",
    iframe: "control-panel-iframe",
    dragHandle: "control-panel-drag-handle",
  },
  RESIZABLE: false,
} as const;

export const SUBTITLES_PANEL: PanelConfig = {
  PANEL_IDS: {
    CONTAINER: "chrome-extension-float-panel-container-subtitles",
    IFRAME: "chrome-extension-float-panel-subtitles",
    DRAG_HANDLE: "chrome-extension-drag-handle-subtitles",
  },
  MIN_DIMENSIONS: {
    WIDTH: 200,
    HEIGHT: 100,
  },
  IFRAME_SRC: "src/entries/subtitles-panel/index.html",
  CSS_CLASSES: {
    container: "subtitles-panel-container",
    iframe: "subtitles-panel-iframe",
    dragHandle: "subtitles-panel-drag-handle",
  },
  RESIZABLE: true,
} as const;

export const RESIZE_HANDLES = [
  "nw",
  "n",
  "ne",
  "w",
  "e",
  "sw",
  "s",
  "se",
] as const;

export const FILTERED_MESSAGE_SOURCES = [
  "react-devtools-content-script",
  "react-devtools-inject-backend",
  "react-devtools-hook",
] as const;

export const FILTERED_MESSAGE_TYPES = [
  "REACT_DEVTOOLS_GLOBAL_HOOK",
  "REACT_DEVTOOLS_BRIDGE",
] as const;

// Drag functionality
export interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  elementStartX: number;
  elementStartY: number;
}

// Resize functionality
export interface ResizeState {
  isResizing: boolean;
  handle: string;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  startLeft: number;
  startTop: number;
}
