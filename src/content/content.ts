console.log("Content script loaded");

function isExtensionContextValid(): boolean {
  try {
    return !!chrome.runtime?.id;
  } catch (error) {
    console.log("Extension context invalidated");
    return false;
  }
}

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isExtensionContextValid()) {
    console.log("Extension context invalid, ignoring message");
    return;
  }

  console.log("Content script received message:", message);

  switch (message.type) {
    case "GET_PAGE_INFO":
      sendResponse({
        url: window.location.href,
        title: document.title,
        domain: window.location.hostname,
      });
      break;

    case "TOGGLE_FLOAT_PANEL":
      sendResponse({ success: true });
      break;

    case "RESIZE_FLOAT_PANEL":
      const panel = document.getElementById(
        "chrome-extension-float-panel"
      ) as HTMLIFrameElement;
      if (panel) {
        panel.style.height = message.height + "px";
        console.log("Float panel resized to:", message.height + "px");
      }
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ error: "Unknown message type" });
  }

  return true;
});

function injectFloatPanel() {
  // Check if extension context is valid
  if (!isExtensionContextValid()) {
    console.log("Extension context invalid, cannot inject float panel");
    return;
  }

  // Check if float panel is already injected
  if (document.getElementById("chrome-extension-float-panel-container")) {
    return;
  }

  try {
    // Create container for float panel
    const container = document.createElement("div");
    container.id = "chrome-extension-float-panel-container";
    container.style.cssText = `
      position: fixed;
      top: 0px;
      left: 0px;
      width: 50px;
      height: 152px;
      z-index: 999999;
      background-color: #000;
      border: none;
      border-radius: 4px;
    `;

    // Create iframe for float panel
    const iframe = document.createElement("iframe");
    iframe.id = "chrome-extension-float-panel";
    iframe.src = chrome.runtime.getURL("src/floatpanel/index.html");
    iframe.style.cssText = `
      width: calc(100%);
      height: calc(100%);
      border: none;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      background: white;
      transition: height 0.3s ease-in-out;
      pointer-events: auto;
    `;

    // Create drag handle overlay for left side of header (where buttons are not)
    const dragHandle = document.createElement("div");
    dragHandle.id = "chrome-extension-drag-handle";
    dragHandle.style.cssText = `
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
    `;

    // Add hover effect for drag handle
    dragHandle.addEventListener("mouseenter", () => {
      dragHandle.style.background = "rgba(59, 130, 246, 0.1)";
    });

    dragHandle.addEventListener("mouseleave", () => {
      dragHandle.style.background = "transparent";
    });

    container.appendChild(iframe);
    container.appendChild(dragHandle);
    document.body.appendChild(container);

    // Add custom drag and resize functionality
    setupDragLogic(container, dragHandle);
    // setupResizeLogic(container);

    console.log("Float panel injected successfully");
  } catch (error) {
    console.error("Failed to inject float panel:", error);
  }
}

// Функції для блокування/розблокування iframe
function blockIframe(container: HTMLElement) {
  const iframe = container.querySelector(
    "#chrome-extension-float-panel"
  ) as HTMLIFrameElement;
  if (iframe) {
    iframe.style.pointerEvents = "none";
  }
}

function unblockIframe(container: HTMLElement) {
  const iframe = container.querySelector(
    "#chrome-extension-float-panel"
  ) as HTMLIFrameElement;
  if (iframe) {
    iframe.style.pointerEvents = "auto";
  }
}

// Custom drag implementation
function setupDragLogic(element: HTMLElement, dragHandle: HTMLElement) {
  // Drag variables
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let elementStartX = 0;
  let elementStartY = 0;

  // Drag functionality
  dragHandle.addEventListener("mousedown", (e) => {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;

    elementStartX = parseFloat(element.getAttribute("data-x") || "0");
    elementStartY = parseFloat(element.getAttribute("data-y") || "0");

    blockIframe(element);
    dragHandle.style.cursor = "grabbing";
    element.style.userSelect = "none";
    document.body.style.userSelect = "none";

    e.preventDefault();
    e.stopPropagation();
  });

  // Global mouse move handler for drag
  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      handleDrag(e);
    }
  });

  // Global mouse up handler for drag
  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      unblockIframe(element);
      dragHandle.style.cursor = "move";
      element.style.userSelect = "";
      document.body.style.userSelect = "";
    }
  });

  // Handle mouse leave window for drag
  document.addEventListener("mouseleave", () => {
    if (isDragging) {
      isDragging = false;
      unblockIframe(element);
      dragHandle.style.cursor = "move";
      element.style.userSelect = "";
      document.body.style.userSelect = "";
    }
  });

  function handleDrag(e: MouseEvent) {
    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;

    const newX = elementStartX + deltaX;
    const newY = elementStartY + deltaY;

    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Constrain to viewport
    const constrainedX = Math.max(
      0,
      Math.min(newX, viewportWidth - rect.width)
    );
    const constrainedY = Math.max(
      0,
      Math.min(newY, viewportHeight - rect.height)
    );

    element.style.transform = `translate(${constrainedX}px, ${constrainedY}px)`;
    element.style.right = "auto";
    element.style.bottom = "auto";

    element.setAttribute("data-x", constrainedX.toString());
    element.setAttribute("data-y", constrainedY.toString());
  }
}

// Custom resize implementation
function setupResizeLogic(element: HTMLElement) {
  // Resize variables
  let isResizing = false;
  let resizeHandle = "";
  let resizeStartX = 0;
  let resizeStartY = 0;
  let startWidth = 0;
  let startHeight = 0;
  let startLeft = 0;
  let startTop = 0;

  const minWidth = 28;
  const minHeight = 18;

  // Create resize handles
  const resizeHandles = ["nw", "n", "ne", "w", "e", "sw", "s", "se"];

  resizeHandles.forEach((handle) => {
    const resizeDiv = document.createElement("div");
    resizeDiv.className = `resize-handle resize-${handle}`;
    resizeDiv.style.cssText = getResizeHandleStyle(handle);
    resizeDiv.setAttribute("data-resize", handle);

    // Add hover effects with different colors for different handle types
    resizeDiv.addEventListener("mouseenter", () => {
      let color = "rgba(59, 130, 246, 0.3)"; // Default blue
      let borderColor = "rgba(59, 130, 246, 0.6)";

      // Different colors for corner vs edge handles
      if (["nw", "ne", "sw", "se"].includes(handle)) {
        // Corner handles - green
        color = "rgba(34, 197, 94, 0.3)";
        borderColor = "rgba(34, 197, 94, 0.6)";
      } else {
        // Edge handles - blue
        color = "rgba(59, 130, 246, 0.3)";
        borderColor = "rgba(59, 130, 246, 0.6)";
      }

      resizeDiv.style.background = color;
      resizeDiv.style.border = `1px solid ${borderColor}`;
    });

    resizeDiv.addEventListener("mouseleave", () => {
      resizeDiv.style.background = "transparent";
      resizeDiv.style.border = "none";
    });

    element.appendChild(resizeDiv);
  });

  // Resize functionality
  element.addEventListener("mousedown", (e) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains("resize-handle")) return;

    isResizing = true;
    resizeHandle = target.getAttribute("data-resize") || "";
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;

    const rect = element.getBoundingClientRect();
    const currentX = parseFloat(element.getAttribute("data-x") || "0");
    const currentY = parseFloat(element.getAttribute("data-y") || "0");

    startWidth = rect.width;
    startHeight = rect.height;
    startLeft = currentX;
    startTop = currentY;

    blockIframe(element);
    element.style.userSelect = "none";
    document.body.style.userSelect = "none";

    e.preventDefault();
    e.stopPropagation();
  });

  // Global mouse move handler for resize
  document.addEventListener("mousemove", (e) => {
    if (isResizing) {
      handleResize(e);
    }
  });

  // Global mouse up handler for resize
  document.addEventListener("mouseup", () => {
    if (isResizing) {
      isResizing = false;
      resizeHandle = "";
      unblockIframe(element);
      element.style.userSelect = "";
      document.body.style.userSelect = "";
    }
  });

  // Handle mouse leave window for resize
  document.addEventListener("mouseleave", () => {
    if (isResizing) {
      isResizing = false;
      resizeHandle = "";
      unblockIframe(element);
      element.style.userSelect = "";
      document.body.style.userSelect = "";
    }
  });

  function handleResize(e: MouseEvent) {
    const deltaX = e.clientX - resizeStartX;
    const deltaY = e.clientY - resizeStartY;

    let newWidth = startWidth;
    let newHeight = startHeight;
    let newLeft = startLeft;
    let newTop = startTop;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Handle horizontal resizing
    if (resizeHandle.includes("w")) {
      const proposedWidth = startWidth - deltaX;
      const proposedLeft = startLeft + deltaX;

      // Check minimum width
      if (proposedWidth >= minWidth) {
        // Check left boundary
        if (proposedLeft >= 0) {
          newWidth = proposedWidth;
          newLeft = proposedLeft;
        } else {
          // Hit left boundary, expand from current position
          newWidth = startWidth + startLeft;
          newLeft = 0;
        }
      } else {
        // Hit minimum width
        newWidth = minWidth;
        newLeft = startLeft + startWidth - minWidth;
      }
    } else if (resizeHandle.includes("e")) {
      const proposedWidth = startWidth + deltaX;

      // Check minimum width
      if (proposedWidth >= minWidth) {
        // Check right boundary
        if (startLeft + proposedWidth <= viewportWidth) {
          newWidth = proposedWidth;
        } else {
          // Hit right boundary
          newWidth = viewportWidth - startLeft;
        }
      } else {
        // Hit minimum width
        newWidth = minWidth;
      }
    }

    // Handle vertical resizing
    if (resizeHandle.includes("n")) {
      const proposedHeight = startHeight - deltaY;
      const proposedTop = startTop + deltaY;

      // Check minimum height
      if (proposedHeight >= minHeight) {
        // Check top boundary
        if (proposedTop >= 0) {
          newHeight = proposedHeight;
          newTop = proposedTop;
        } else {
          // Hit top boundary, expand from current position
          newHeight = startHeight + startTop;
          newTop = 0;
        }
      } else {
        // Hit minimum height
        newHeight = minHeight;
        newTop = startTop + startHeight - minHeight;
      }
    } else if (resizeHandle.includes("s")) {
      const proposedHeight = startHeight + deltaY;

      // Check minimum height
      if (proposedHeight >= minHeight) {
        // Check bottom boundary
        if (startTop + proposedHeight <= viewportHeight) {
          newHeight = proposedHeight;
        } else {
          // Hit bottom boundary
          newHeight = viewportHeight - startTop;
        }
      } else {
        // Hit minimum height
        newHeight = minHeight;
      }
    }

    // Apply changes
    element.style.width = newWidth + "px";
    element.style.height = newHeight + "px";
    element.style.transform = `translate(${newLeft}px, ${newTop}px)`;
    element.style.right = "auto";
    element.style.bottom = "auto";

    element.setAttribute("data-x", newLeft.toString());
    element.setAttribute("data-y", newTop.toString());
  }

  function getResizeHandleStyle(handle: string): string {
    const baseStyle = `
      position: absolute;
      background: transparent;
      z-index: 1000001;
      transition: background-color 0.2s ease, border 0.2s ease;
    `;

    const styles: { [key: string]: string } = {
      nw: `${baseStyle} top: 0; left: 0; width: 4px; height: 4px; cursor: nw-resize;`,
      n: `${baseStyle}  top: 0; left: 4px; right: 4px; height: 4px; cursor: n-resize;`,
      ne: `${baseStyle} top: 0; right: 0; width: 4px; height: 4px; cursor: ne-resize;`,
      w: `${baseStyle}  top: 4px; left: 0; width: 4px; bottom: 4px; cursor: w-resize;`,
      e: `${baseStyle}  top: 4px; right: 0; width: 4px; bottom: 4px; cursor: e-resize;`,
      sw: `${baseStyle} bottom: 0; left: 0; width: 4px; height: 4px; cursor: sw-resize;`,
      s: `${baseStyle}  bottom: 0; left: 4px; right: 4px; height: 4px; cursor: s-resize;`,
      se: `${baseStyle} bottom: 0; right: 0; width: 4px; height: 4px; cursor: se-resize;`,
    };

    return styles[handle] || baseStyle;
  }
}

function removeFloatPanel() {
  const container = document.getElementById(
    "chrome-extension-float-panel-container"
  );
  if (container) {
    // Remove all event listeners by cloning and replacing the element
    const newContainer = container.cloneNode(true);
    if (container.parentNode) {
      container.parentNode.replaceChild(newContainer, container);
      (newContainer as HTMLElement).remove();
    }
  }
}

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (!isExtensionContextValid()) {
    console.log("Extension context invalid, ignoring storage changes");
    return;
  }

  if (namespace === "local" && changes.floatPanelVisible) {
    if (changes.floatPanelVisible.newValue) {
      injectFloatPanel();
    } else {
      removeFloatPanel();
    }
  }
});

// Initialize - always show float panel by default
function initializeFloatPanel() {
  if (!isExtensionContextValid()) {
    console.log("Extension context invalid, cannot initialize float panel");
    return;
  }

  chrome.storage.local.get(["floatPanelVisible"], (result) => {
    // If no setting exists, default to true (show panel)
    if (result.floatPanelVisible !== false) {
      // Wait for page to be fully loaded
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
          setTimeout(injectFloatPanel, 1000); // Small delay to ensure page is ready
        });
      } else {
        setTimeout(injectFloatPanel, 1000); // Small delay to ensure page is ready
      }
    }
  });
}

// Listen for messages from iframe
window.addEventListener("message", (event) => {
  // Filter out React DevTools messages immediately
  if (event.data && event.data.source === "react-devtools-content-script") {
    return;
  }

  // Filter out other common extension messages
  if (
    event.data &&
    (event.data.source === "react-devtools-inject-backend" ||
      event.data.source === "react-devtools-hook" ||
      event.data.type === "REACT_DEVTOOLS_GLOBAL_HOOK" ||
      event.data.type === "REACT_DEVTOOLS_BRIDGE")
  ) {
    return;
  }

  // Check if message is from our iframe
  const iframe = document.getElementById(
    "chrome-extension-float-panel"
  ) as HTMLIFrameElement;
  if (iframe && event.source !== iframe.contentWindow) {
    return;
  }

  // Only log messages from our extension
  console.log(
    "Content script received postMessage:",
    event.data,
    "from:",
    event.source
  );
  console.log("Processing message:", event.data);

  if (event.data && event.data.type === "RESIZE_FLOAT_PANEL") {
    const container = document.getElementById(
      "chrome-extension-float-panel-container"
    );
    if (container) {
      container.style.height = event.data.height + 16 + "px";
      console.log("Float panel resized to:", event.data.height + 16 + "px");
    } else {
      console.log("Float panel container not found");
    }
  }

  if (event.data && event.data.type === "MOVE_FLOAT_PANEL") {
    const container = document.getElementById(
      "chrome-extension-float-panel-container"
    );
    if (container) {
      container.style.left = event.data.x + "px";
      container.style.top = event.data.y + "px";
      container.style.right = "auto";
      console.log("Float panel moved to:", event.data.x, event.data.y);
    } else {
      console.log("Float panel container not found");
    }
  }
});

// Initialize when script loads
initializeFloatPanel();
