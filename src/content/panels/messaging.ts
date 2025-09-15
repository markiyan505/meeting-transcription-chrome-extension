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


export function handleResizeMessage(data: any): void {
  const container = document.getElementById(CONTROL_PANEL.PANEL_IDS.CONTAINER);
  if (!container) {
    return;
  }


  container.style.width = data.width + "px";
  container.style.height = data.height + "px";


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
}

export function handleOrientationChangeMessage(data: any): void {
  const container = document.getElementById(CONTROL_PANEL.PANEL_IDS.CONTAINER);
  const dragHandle = document.getElementById(
    CONTROL_PANEL.PANEL_IDS.DRAG_HANDLE
  );
  if (!container) {
    return;
  }

  const currentWidth = parseInt(container.style.width) || 50;
  const currentHeight = parseInt(container.style.height) || 50;

  container.style.width = currentHeight + "px";
  container.style.height = currentWidth + "px";
  if (dragHandle) {
    const computedStyle = window.getComputedStyle(dragHandle);
    const dragWidth = computedStyle.width;
    const dragHeight = computedStyle.height;

    dragHandle.style.width = dragHeight;
    dragHandle.style.height = dragWidth;
  }

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
}

export function handleMoveMessage(data: any): void {
  const container = document.getElementById(CONTROL_PANEL.PANEL_IDS.CONTAINER);
  if (container) {
    container.style.left = data.x + "px";
    container.style.top = data.y + "px";
    container.style.right = "auto";
  } else {
  }
}

export function setupWindowMessageHandler(): void {
  window.addEventListener("message", (event) => {
    if (shouldFilterMessage(event) || !isMessageFromOurIframe(event)) {
      return;
    }

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
