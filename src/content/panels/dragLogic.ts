import { DragState } from "../types/types";
import {
  getElementPosition,
  setElementPosition,
  constrainToViewport,
  blockIframe,
  unblockIframe,
} from "../utils/utils";

// Drag functionality
export function setupDragLogic(
  element: HTMLElement,
  dragHandle: HTMLElement,
  iframe: HTMLIFrameElement
): void {
  const dragState: DragState = {
    isDragging: false,
    startX: 0,
    startY: 0,
    elementStartX: 0,
    elementStartY: 0,
  };

  const startDrag = (e: MouseEvent) => {
    dragState.isDragging = true;
    dragState.startX = e.clientX;
    dragState.startY = e.clientY;

    const position = getElementPosition(element);
    dragState.elementStartX = position.x;
    dragState.elementStartY = position.y;

    blockIframe(iframe);
    dragHandle.style.cursor = "grabbing";
    element.style.userSelect = "none";
    document.body.style.userSelect = "none";

    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrag = (e: MouseEvent) => {
    if (!dragState.isDragging) return;

    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;

    const newX = dragState.elementStartX + deltaX;
    const newY = dragState.elementStartY + deltaY;

    const rect = element.getBoundingClientRect();
    const constrained = constrainToViewport(
      newX,
      newY,
      rect.width,
      rect.height
    );

    setElementPosition(element, constrained.x, constrained.y);
  };

  const endDrag = () => {
    if (!dragState.isDragging) return;

    dragState.isDragging = false;
    unblockIframe(iframe);
    dragHandle.style.cursor = "move";
    element.style.userSelect = "";
    document.body.style.userSelect = "";
  };

  dragHandle.addEventListener("mousedown", startDrag);
  document.addEventListener("mousemove", handleDrag);
  document.addEventListener("mouseup", endDrag);
  document.addEventListener("mouseleave", endDrag);
}
