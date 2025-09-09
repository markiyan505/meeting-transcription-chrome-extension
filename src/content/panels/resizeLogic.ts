import { ResizeState, RESIZE_HANDLES } from "../types/types";
import {
  getElementPosition,
  setElementPosition,
  blockIframe,
  unblockIframe,
} from "../utils/utils";

function createResizeHandle(handle: string): HTMLDivElement {
  const resizeDiv = document.createElement("div");
  resizeDiv.className = `resize-handle resize-${handle}`;
  resizeDiv.style.cssText = getResizeHandleStyle(handle);
  resizeDiv.setAttribute("data-resize", handle);

  // Add hover effects
  resizeDiv.addEventListener("mouseenter", () => {
    const isCorner = ["nw", "ne", "sw", "se"].includes(handle);
    const color = isCorner
      ? "rgba(34, 197, 94, 0.3)"
      : "rgba(59, 130, 246, 0.3)";
    const borderColor = isCorner
      ? "rgba(34, 197, 94, 0.6)"
      : "rgba(59, 130, 246, 0.6)";

    resizeDiv.style.background = color;
    resizeDiv.style.border = `1px solid ${borderColor}`;
  });

  resizeDiv.addEventListener("mouseleave", () => {
    resizeDiv.style.background = "transparent";
    resizeDiv.style.border = "none";
  });

  return resizeDiv;
}

function getResizeHandleStyle(handle: string): string {
  const baseStyle = `
    position: absolute;
    background: transparent;
    z-index: 1000001;
    transition: background-color 0.2s ease, border 0.2s ease;
  `;

  const styles: Record<string, string> = {
    nw: `${baseStyle} top: 0; left: 0; width: 4px; height: 4px; cursor: nw-resize;`,
    n: `${baseStyle} top: 0; left: 4px; right: 4px; height: 4px; cursor: n-resize;`,
    ne: `${baseStyle} top: 0; right: 0; width: 4px; height: 4px; cursor: ne-resize;`,
    w: `${baseStyle} top: 4px; left: 0; width: 4px; bottom: 4px; cursor: w-resize;`,
    e: `${baseStyle} top: 4px; right: 0; width: 4px; bottom: 4px; cursor: e-resize;`,
    sw: `${baseStyle} bottom: 0; left: 0; width: 4px; height: 4px; cursor: sw-resize;`,
    s: `${baseStyle} bottom: 0; left: 4px; right: 4px; height: 4px; cursor: s-resize;`,
    se: `${baseStyle} bottom: 0; right: 0; width: 4px; height: 4px; cursor: se-resize;`,
  };

  return styles[handle] || baseStyle;
}

function calculateResizeDimensions(
  resizeState: ResizeState,
  deltaX: number,
  deltaY: number,
  minDimensions: { WIDTH: number; HEIGHT: number }
): { width: number; height: number; left: number; top: number } {
  let { startWidth, startHeight, startLeft, startTop } = resizeState;
  const { handle } = resizeState;

  let newWidth = startWidth;
  let newHeight = startHeight;
  let newLeft = startLeft;
  let newTop = startTop;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Handle horizontal resizing
  if (handle.includes("w")) {
    const proposedWidth = startWidth - deltaX;
    const proposedLeft = startLeft + deltaX;

    if (proposedWidth >= minDimensions.WIDTH) {
      if (proposedLeft >= 0) {
        newWidth = proposedWidth;
        newLeft = proposedLeft;
      } else {
        newWidth = startWidth + startLeft;
        newLeft = 0;
      }
    } else {
      newWidth = minDimensions.WIDTH;
      newLeft = startLeft + startWidth - minDimensions.WIDTH;
    }
  } else if (handle.includes("e")) {
    const proposedWidth = startWidth + deltaX;

    if (proposedWidth >= minDimensions.WIDTH) {
      if (startLeft + proposedWidth <= viewportWidth) {
        newWidth = proposedWidth;
      } else {
        newWidth = viewportWidth - startLeft;
      }
    } else {
      newWidth = minDimensions.WIDTH;
    }
  }

  // Handle vertical resizing
  if (handle.includes("n")) {
    const proposedHeight = startHeight - deltaY;
    const proposedTop = startTop + deltaY;

    if (proposedHeight >= minDimensions.HEIGHT) {
      if (proposedTop >= 0) {
        newHeight = proposedHeight;
        newTop = proposedTop;
      } else {
        newHeight = startHeight + startTop;
        newTop = 0;
      }
    } else {
      newHeight = minDimensions.HEIGHT;
      newTop = startTop + startHeight - minDimensions.HEIGHT;
    }
  } else if (handle.includes("s")) {
    const proposedHeight = startHeight + deltaY;

    if (proposedHeight >= minDimensions.HEIGHT) {
      if (startTop + proposedHeight <= viewportHeight) {
        newHeight = proposedHeight;
      } else {
        newHeight = viewportHeight - startTop;
      }
    } else {
      newHeight = minDimensions.HEIGHT;
    }
  }

  return { width: newWidth, height: newHeight, left: newLeft, top: newTop };
}

// Resize functionality
export function setupResizeLogic(
  element: HTMLElement,
  iframe: HTMLIFrameElement,
  minDimensions: { WIDTH: number; HEIGHT: number }
): void {
  const resizeState: ResizeState = {
    isResizing: false,
    handle: "",
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    startLeft: 0,
    startTop: 0,
  };

  // Create resize handles
  RESIZE_HANDLES.forEach((handle) => {
    const resizeDiv = createResizeHandle(handle);
    element.appendChild(resizeDiv);
  });

  const startResize = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains("resize-handle")) return;

    resizeState.isResizing = true;
    resizeState.handle = target.getAttribute("data-resize") || "";
    resizeState.startX = e.clientX;
    resizeState.startY = e.clientY;

    const rect = element.getBoundingClientRect();
    const position = getElementPosition(element);

    resizeState.startWidth = rect.width;
    resizeState.startHeight = rect.height;
    resizeState.startLeft = position.x;
    resizeState.startTop = position.y;

    blockIframe(iframe);
    element.style.userSelect = "none";
    document.body.style.userSelect = "none";

    e.preventDefault();
    e.stopPropagation();
  };

  const handleResize = (e: MouseEvent) => {
    if (!resizeState.isResizing) return;

    const deltaX = e.clientX - resizeState.startX;
    const deltaY = e.clientY - resizeState.startY;

    const dimensions = calculateResizeDimensions(
      resizeState,
      deltaX,
      deltaY,
      minDimensions
    );

    element.style.width = dimensions.width + "px";
    element.style.height = dimensions.height + "px";
    setElementPosition(element, dimensions.left, dimensions.top);
  };

  const endResize = () => {
    if (!resizeState.isResizing) return;

    resizeState.isResizing = false;
    resizeState.handle = "";
    unblockIframe(iframe);
    element.style.userSelect = "";
    document.body.style.userSelect = "";
  };

  element.addEventListener("mousedown", startResize);
  document.addEventListener("mousemove", handleResize);
  document.addEventListener("mouseup", endResize);
  document.addEventListener("mouseleave", endResize);
}
