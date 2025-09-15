import {
  FILTERED_MESSAGE_SOURCES,
  FILTERED_MESSAGE_TYPES,
  CONTROL_PANEL,
} from "../types/types";
import {
  isExtensionContextValid,
  getElementPosition,
  setElementPosition,
  constrainToViewport,
} from "../utils/utils";

// Message filtering
export function shouldFilterMessage(event: MessageEvent): boolean {
  const data = event.data;
  if (!data) return false;

  return (
    FILTERED_MESSAGE_SOURCES.some((source) => data.source === source) ||
    FILTERED_MESSAGE_TYPES.some((type) => data.type === type)
  );
}

export function isMessageFromOurIframe(event: MessageEvent): boolean {
  const iframe = document.getElementById(
    CONTROL_PANEL.PANEL_IDS.IFRAME
  ) as HTMLIFrameElement;
  return !!(iframe && event.source === iframe.contentWindow);
}

// Message handlers
export function handleResizeMessage(data: any): void {
  const container = document.getElementById(CONTROL_PANEL.PANEL_IDS.CONTAINER);
  if (!container) {
    console.log("Float panel container not found");
    return;
  }

  // Set exact dimensions
  container.style.width = data.width + "px";
  container.style.height = data.height + "px";

  // Check viewport boundaries
  const position = getElementPosition(container);
  const constrained = constrainToViewport(
    position.x,
    position.y,
    data.width,
    data.height
  );

  if (constrained.x !== position.x || constrained.y !== position.y) {
    setElementPosition(container, constrained.x, constrained.y);
  }

  // console.log("[CONTENT SCRIPT] Float panel resized:", {
  //   width: container.style.width,
  //   height: container.style.height,
  //   orientation: data.orientation,
  //   isCollapsed: data.isCollapsed,
  //   state: data.state,
  //   error: data.error,
  //   position: constrained,
  // });
}

export function handleOrientationChangeMessage(data: any): void {
  console.log("messaging handleOrientationChangeMessage", data);
  const container = document.getElementById(CONTROL_PANEL.PANEL_IDS.CONTAINER);
  const dragHandle = document.getElementById(
    CONTROL_PANEL.PANEL_IDS.DRAG_HANDLE
  );
  if (!container) {
    return;
  }

  // Swap dimensions
  const currentWidth = parseInt(container.style.width) || 50;
  const currentHeight = parseInt(container.style.height) || 50;

  container.style.width = currentHeight + "px";
  container.style.height = currentWidth + "px";
  if (dragHandle) {
    // Get computed styles since dragHandle uses CSS classes
    const computedStyle = window.getComputedStyle(dragHandle);
    const dragWidth = computedStyle.width;
    const dragHeight = computedStyle.height;

    // Swap the dimensions
    dragHandle.style.width = dragHeight;
    dragHandle.style.height = dragWidth;
  }

  // Check viewport boundaries
  const position = getElementPosition(container);
  const constrained = constrainToViewport(
    position.x,
    position.y,
    currentHeight,
    currentWidth
  );

  if (constrained.x !== position.x || constrained.y !== position.y) {
    setElementPosition(container, constrained.x, constrained.y);
  }

  // console.log("[CONTENT SCRIPT] Float panel orientation changed:", {
  //   orientation: data.orientation,
  //   isCollapsed: data.isCollapsed,
  //   width: container.style.width,
  //   height: container.style.height,
  //   position: constrained,
  // });
}

export function handleMoveMessage(data: any): void {
  const container = document.getElementById(CONTROL_PANEL.PANEL_IDS.CONTAINER);
  if (container) {
    container.style.left = data.x + "px";
    container.style.top = data.y + "px";
    container.style.right = "auto";
    // console.log("Float panel moved to:", data.x, data.y);
  } else {
    console.log("Float panel container not found");
  }
}

// Window message handler
export function setupWindowMessageHandler(): void {
  window.addEventListener("message", (event) => {
    if (shouldFilterMessage(event) || !isMessageFromOurIframe(event)) {
      return;
    }

    console.log(
      "[CONTENT SCRIPT] Received postMessage:",
      event.data,
      "from:",
      event.source
    );

    const messageHandlers = {
      RESIZE_FLOAT_PANEL: handleResizeMessage,
      ORIENTATION_CHANGE_FLOAT_PANEL: handleOrientationChangeMessage,
      MOVE_FLOAT_PANEL: handleMoveMessage,
    };

    const handler =
      messageHandlers[event.data?.type as keyof typeof messageHandlers];

    if (handler) {
      handler(event.data);
    }
  });
}
