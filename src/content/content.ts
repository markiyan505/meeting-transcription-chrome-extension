console.log("Content script loaded");

declare const interact: any;

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
      width: 416px;
      height: 316px;
      z-index: 999999;
      background-color: #000;
      border: none;
      border-radius: 8px;
    `;

    // const containerContent = document.createElement("div");
    // container.id = "chrome-extension-float-panel-container-content";
    // containerContent.style.cssText = `
    //   width: calc(100% - 16px);
    //   height: calc(100% - 16px);
    //   border: none;
    //   border-radius: 8px;
    //   margin: 8px;
    // `;

    // Create iframe for float panel
    const iframe = document.createElement("iframe");
    iframe.id = "chrome-extension-float-panel";
    iframe.src = chrome.runtime.getURL("src/floatpanel/index.html");
    iframe.style.cssText = `
      width: calc(100% - 16px);
      height: calc(100% - 16px);
      border: none;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      background: white;
      transition: height 0.3s ease-in-out;
      pointer-events: auto;
      margin: 8px;
    `;

    // Create drag handle overlay for left side of header (where buttons are not)
    const dragHandle = document.createElement("div");
    dragHandle.id = "chrome-extension-drag-handle";
    dragHandle.style.cssText = `
      position: absolute;
      top: 8px;
      left: 8px;
      right: 80px;
      height: 40px;
      z-index: 1000000;
      cursor: move;
      background: transparent;
    `;

    // container.appendChild(iframe);
    container.appendChild(dragHandle);
    document.body.appendChild(container);

    // Add drag and resize functionality using interact.js
    // setupInteract(container);
    setupInteract(container, dragHandle);
    // setupAlternativeInteract(container, dragHandle);

    console.log("Float panel injected successfully");
  } catch (error) {
    console.error("Failed to inject float panel:", error);
  }
}

// Прості функції для блокування/розблокування iframe
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

// function setupAlternativeInteract(
//   element: HTMLElement,
//   dragHandle: HTMLElement
// ) {
//   let isDragging = false;
//   let startX = 0;
//   let startY = 0;
//   let startPanelX = 0;
//   let startPanelY = 0;

//   dragHandle.addEventListener("mousedown", (e) => {
//     isDragging = true;
//     startX = e.clientX;
//     startY = e.clientY;

//     const currentX = parseFloat(element.getAttribute("data-x") || "0");
//     const currentY = parseFloat(element.getAttribute("data-y") || "0");
//     startPanelX = currentX;
//     startPanelY = currentY;

//     // Блокуємо iframe під час перетягування
//     blockIframe(element);

//     dragHandle.style.cursor = "move";
//     element.style.userSelect = "none";
//     document.body.style.userSelect = "none";

//     e.preventDefault();
//   });

//   document.addEventListener("mousemove", (e) => {
//     if (!isDragging) return;

//     const deltaX = e.clientX - startX;
//     const deltaY = e.clientY - startY;

//     const newX = startPanelX + deltaX;
//     const newY = startPanelY + deltaY;

//     // Get current panel dimensions
//     const panelRect = element.getBoundingClientRect();
//     const panelWidth = panelRect.width;
//     const panelHeight = panelRect.height;

//     // Calculate viewport dimensions
//     const viewportWidth = window.innerWidth;
//     const viewportHeight = window.innerHeight;

//     // Calculate bounds
//     const minX = 0;
//     const minY = 0;
//     const maxX = Math.max(0, viewportWidth - panelWidth);
//     const maxY = Math.max(0, viewportHeight - panelHeight);

//     // Constrain the position
//     const constrainedX = Math.max(minX, Math.min(newX, maxX));
//     const constrainedY = Math.max(minY, Math.min(newY, maxY));

//     // Apply the transformation
//     element.style.transform = `translate(${constrainedX}px, ${constrainedY}px)`;
//     element.style.right = "auto";
//     element.style.bottom = "auto";

//     // Store the constrained positions
//     element.setAttribute("data-x", constrainedX.toString());
//     element.setAttribute("data-y", constrainedY.toString());

//     e.preventDefault();
//   });

//   document.addEventListener("mouseup", () => {
//     if (!isDragging) return;

//     isDragging = false;

//     // Розблоковуємо iframe після перетягування
//     unblockIframe(element);

//     dragHandle.style.cursor = "move";
//     element.style.userSelect = "";
//     document.body.style.userSelect = "";
//   });

//   // Handle case where mouse leaves the window during drag
//   document.addEventListener("mouseleave", () => {
//     if (isDragging) {
//       isDragging = false;

//       // Розблоковуємо iframe якщо миша покинула вікно
//       unblockIframe(element);

//       dragHandle.style.cursor = "move";
//       element.style.userSelect = "";
//       document.body.style.userSelect = "";
//     }
//   });
// }

// Setup interact.js for drag and resize functionality
function setupInteract(element: HTMLElement, dragHandle: HTMLElement) {
  // function setupInteract(element: HTMLElement) {
  // Check if interact.js is available
  if (typeof interact === "undefined") {
    console.error("interact.js is not loaded");
    return;
  }

  // Fixed draggable move listener with correct boundary calculations
  interact(dragHandle).draggable({
    listeners: {
      start() {
        console.log("Drag start");
        // Блокуємо iframe під час перетягування
        blockIframe(element);
      },
      move(event: any) {
        const target = element;
        const x = parseFloat(target.getAttribute("data-x") || "0") + event.dx;
        const y = parseFloat(target.getAttribute("data-y") || "0") + event.dy;

        // Get current panel dimensions
        const panelRect = target.getBoundingClientRect();
        const panelWidth = panelRect.width;
        const panelHeight = panelRect.height;

        // Calculate viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Keep element within viewport bounds
        // Minimum positions (top-left corner shouldn't go beyond viewport)
        const minX = 0;
        const minY = 0;

        // Maximum positions (bottom-right corner shouldn't go beyond viewport)
        const maxX = viewportWidth - panelWidth;
        const maxY = viewportHeight - panelHeight;

        // Constrain the position
        const constrainedX = Math.max(minX, Math.min(x, maxX));
        const constrainedY = Math.max(minY, Math.min(y, maxY));

        // Apply the transformation
        target.style.transform = `translate(${constrainedX}px, ${constrainedY}px)`;
        target.style.right = "auto";
        target.style.bottom = "auto";

        // Store the constrained positions
        target.setAttribute("data-x", constrainedX.toString());
        target.setAttribute("data-y", constrainedY.toString());
      },
      end() {
        console.log("Drag end");
        // Розблоковуємо iframe після перетягування
        unblockIframe(element);
      },
    },
  });

  // Make element resizable
  interact(element).resizable({
    edges: { left: true, right: true, bottom: true, top: true },
    margin: 8,
    listeners: {
      start(event: any) {
        console.log("Resize start", event);
        // Блокуємо iframe під час зміни розміру
        blockIframe(element);
      },
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
      end(event: any) {
        console.log("Resize end", event);
        // Розблоковуємо iframe після зміни розміру
        unblockIframe(element);
      },
    },
    modifiers: [
      // Keep element within viewport
      interact.modifiers.restrictSize({
        min: { width: 200 + 16, height: 100 + 16 },
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
