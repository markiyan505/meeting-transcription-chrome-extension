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
  DEFAULT_STYLES: {
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
  IFRAME_SRC: "src/floatpanel/index.html",
  DEFAULT_STYLES: {
    container: `
      position: fixed;
      top: 0px;
      left: 0px;
      width: auto;
      height: auto;
      min-width: 50px;
      min-height: 50px;
      z-index: 999999;
      background-color: transparent;
      border: none;
      border-radius: 4px;
      overflow: visible;
    `,
    iframe: `
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      background: white;
      pointer-events: auto;
      display: block;
    `,
    dragHandle: `
      position: absolute;
      top: 0px;
      left: 0px;
      height: 28px;
      width: 50px;
      border: none;
      border-top-left-radius: 4px;
      border-top-right-radius: 4px;
      z-index: 1000000;
      cursor: move;
      background: rgba(0, 0, 0, 0.01);
      transition: background-color 0.2s ease;
    `,
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
  IFRAME_SRC: "src/float-panel-subtitles/index.html",
  DEFAULT_STYLES: {
    container: `
      position: fixed;
      top: 200px;
      left: 300px;
      width: 300px;
      height: 156px;
      z-index: 999999;
      background-color: #000;
      border: none;
      border-radius: 8px;
    `,
    iframe: `
      width: calc(100% - 8px);
      height: calc(100% - 8px);
      border: none;
      border-radius: 5px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      background: white;
      transition: height 0.3s ease-in-out;
      pointer-events: auto;
      margin: 4px;
    `,
    dragHandle: `
      position: absolute;
      top: 4px;
      left: 4px;
      height: 28px;
      width: 50px;
      border: none;
      border-top-left-radius: 4px;
      border-top-right-radius: 4px;
      z-index: 1000000;
      cursor: move;
      background: rgba(0, 0, 0, 0.01);
      transition: background-color 0.2s ease;
    `,
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
