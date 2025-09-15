import { PanelConfig } from "../types/types";
import {
  isExtensionContextValid,
  createBaseContainer,
  createIframe,
  createDragHandle,
} from "../utils/utils";
import { setupDragLogic } from "./dragLogic";
import { setupResizeLogic } from "./resizeLogic";

export function createFloatPanel(config: PanelConfig): void {
  if (
    !isExtensionContextValid() ||
    document.getElementById(config.PANEL_IDS.CONTAINER)
  ) {
    return;
  }

  try {
    const container = createBaseContainer(
      config.PANEL_IDS.CONTAINER,
      config.CSS_CLASSES.container
    );
    const iframe = createIframe(
      config.PANEL_IDS.IFRAME,
      config.IFRAME_SRC,
      config.CSS_CLASSES.iframe
    );
    const dragHandle = createDragHandle(
      config.PANEL_IDS.DRAG_HANDLE,
      config.CSS_CLASSES.dragHandle
    );

    container.appendChild(iframe);
    container.appendChild(dragHandle);

    container.style.display = "none";

    document.body.appendChild(container);

    setupDragLogic(container, dragHandle, iframe);

    if (config.RESIZABLE) {
      setupResizeLogic(container, iframe, config.MIN_DIMENSIONS);
    }
  } catch (error) {
    console.error(`Failed to inject ${config.PANEL_IDS.CONTAINER}:`, error);
  }
}
