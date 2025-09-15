export function isExtensionContextValid(): boolean {
  try {
    return !!chrome.runtime?.id;
  } catch (error) {
    return false;
  }
}

export function createBaseContainer(
  id: string,
  className: string
): HTMLDivElement {
  const container = document.createElement("div");
  container.id = id;
  container.className = className;
  return container;
}

export function createIframe(
  id: string,
  src: string,
  className: string
): HTMLIFrameElement {
  const iframe = document.createElement("iframe");
  iframe.id = id;
  iframe.src = chrome.runtime.getURL(src);
  iframe.className = className;
  return iframe;
}

export function createDragHandle(
  id: string,
  className: string
): HTMLDivElement {
  const dragHandle = document.createElement("div");
  dragHandle.id = id;
  dragHandle.className = className;
  return dragHandle;
}

export function getElementPosition(element: HTMLElement): {
  x: number;
  y: number;
} {
  return {
    x: parseFloat(element.getAttribute("data-x") || "0"),
    y: parseFloat(element.getAttribute("data-y") || "0"),
  };
}

export function setElementPosition(
  element: HTMLElement,
  x: number,
  y: number
): void {
  element.style.transform = `translate(${x}px, ${y}px)`;
  element.style.right = "auto";
  element.style.bottom = "auto";
  element.setAttribute("data-x", x.toString());
  element.setAttribute("data-y", y.toString());
}

export function constrainToViewport(
  x: number,
  y: number,
  width: number,
  height: number
): { x: number; y: number } {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  return {
    x: Math.max(0, Math.min(x, viewportWidth - width)),
    y: Math.max(0, Math.min(y, viewportHeight - height)),
  };
}

export function toggleIframeInteraction(
  iframe: HTMLIFrameElement,
  block: boolean
): void {
  if (iframe) {
    iframe.style.pointerEvents = block ? "none" : "auto";
  }
}

export const blockIframe = (iframe: HTMLIFrameElement) =>
  toggleIframeInteraction(iframe, true);
export const unblockIframe = (iframe: HTMLIFrameElement) =>
  toggleIframeInteraction(iframe, false);

export function removeFloatPanel(panelIds: { CONTAINER: string }): void {
  const container = document.getElementById(panelIds.CONTAINER);
  if (container?.parentNode) {
    const newContainer = container.cloneNode(true);
    container.parentNode.replaceChild(newContainer, container);
    (newContainer as HTMLElement).remove();
  }
}
