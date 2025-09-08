// Content script for Chrome extension
console.log("Content script loaded");

// Declare interact as a global variable (loaded by interact.js script)
declare const interact: any;

// Check if extension context is valid
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
      // This would be handled by the float panel injection
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

  return true; // Keep message channel open for async response
});

// Inject float panel when needed
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
      top: 100px;
      right: 20px;
      width: 400px;
      height: 300px;
      z-index: 999999;
    `;

    // Create iframe for float panel
    const iframe = document.createElement("iframe");
    iframe.id = "chrome-extension-float-panel";
    iframe.src = chrome.runtime.getURL("src/floatpanel/index.html");
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 8px;
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
      top: 0;
      left: 0;
      right: 80px;
      height: 40px;
      z-index: 1000000;
      cursor: move;
      background: transparent;
    `;

    container.appendChild(iframe);
    container.appendChild(dragHandle);
    document.body.appendChild(container);

    // Add drag and resize functionality using interact.js
    setupInteract(container, dragHandle);

    console.log("Float panel injected successfully");
  } catch (error) {
    console.error("Failed to inject float panel:", error);
  }
}

// Setup interact.js for drag and resize functionality
function setupInteract(element: HTMLElement, dragHandle: HTMLElement) {
  // Check if interact.js is available
  if (typeof interact === "undefined") {
    console.error("interact.js is not loaded");
    return;
  }

  // Make element draggable using the drag handle
  interact(dragHandle).draggable({
    listeners: {
      start() {
        console.log("Drag start");
      },
      move(event: any) {
        const target = element;
        const x = parseFloat(target.getAttribute("data-x") || "0") + event.dx;
        const y = parseFloat(target.getAttribute("data-y") || "0") + event.dy;

        // Keep element within viewport bounds
        const maxX = window.innerWidth - target.offsetWidth;
        const maxY = window.innerHeight - target.offsetHeight;

        const constrainedX = Math.max(0, Math.min(x, maxX));
        const constrainedY = Math.max(0, Math.min(y, maxY));

        target.style.transform = `translate(${constrainedX}px, ${constrainedY}px)`;
        target.style.right = "auto";
        target.style.bottom = "auto";

        target.setAttribute("data-x", constrainedX.toString());
        target.setAttribute("data-y", constrainedY.toString());
      },
      end() {
        console.log("Drag end");
      },
    },
  });

  // Make element resizable
  interact(element).resizable({
    edges: { left: true, right: true, bottom: true, top: true },
    listeners: {
      move(event: any) {
        const target = event.target;
        let x = parseFloat(target.getAttribute("data-x") || "0");
        let y = parseFloat(target.getAttribute("data-y") || "0");

        // Update element size
        target.style.width = event.rect.width + "px";
        target.style.height = event.rect.height + "px";

        // Update element position
        x += event.deltaRect.left;
        y += event.deltaRect.top;

        // Keep element within viewport bounds
        const maxX = window.innerWidth - target.offsetWidth;
        const maxY = window.innerHeight - target.offsetHeight;

        const constrainedX = Math.max(0, Math.min(x, maxX));
        const constrainedY = Math.max(0, Math.min(y, maxY));

        target.style.transform = `translate(${constrainedX}px, ${constrainedY}px)`;
        target.style.right = "auto";
        target.style.bottom = "auto";

        target.setAttribute("data-x", constrainedX.toString());
        target.setAttribute("data-y", constrainedY.toString());
      },
    },
    modifiers: [
      // Keep element within viewport
      interact.modifiers.restrictSize({
        min: { width: 200, height: 100 },
      }),
    ],
  });
}

function removeFloatPanel() {
  const container = document.getElementById(
    "chrome-extension-float-panel-container"
  );
  if (container) {
    // Clean up interact.js instances if available
    if (typeof interact !== "undefined") {
      interact(container).unset();
      const dragHandle = container.querySelector(
        "#chrome-extension-drag-handle"
      ) as HTMLElement;
      if (dragHandle) {
        interact(dragHandle).unset();
      }
    }
    container.remove();
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
      container.style.height = event.data.height + "px";
      console.log("Float panel resized to:", event.data.height + "px");
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
