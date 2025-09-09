import { PanelConfig } from "../types/types";
import {
  isExtensionContextValid,
  createBaseContainer,
  createIframe,
  createDragHandle,
} from "../utils/utils";
import { setupDragLogic } from "./dragLogic";
import { setupResizeLogic } from "./resizeLogic";

// Unified panel creation function
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
      config.DEFAULT_STYLES.container
    );
    const iframe = createIframe(
      config.PANEL_IDS.IFRAME,
      config.IFRAME_SRC,
      config.DEFAULT_STYLES.iframe
    );
    const dragHandle = createDragHandle(
      config.PANEL_IDS.DRAG_HANDLE,
      config.DEFAULT_STYLES.dragHandle
    );

    container.appendChild(iframe);
    container.appendChild(dragHandle);
    document.body.appendChild(container);

    setupDragLogic(container, dragHandle, iframe);

    if (config.RESIZABLE) {
      setupResizeLogic(container, iframe, config.MIN_DIMENSIONS);
    }

    console.log(`${config.PANEL_IDS.CONTAINER} injected successfully`);
  } catch (error) {
    console.error(`Failed to inject ${config.PANEL_IDS.CONTAINER}:`, error);
  }
}
