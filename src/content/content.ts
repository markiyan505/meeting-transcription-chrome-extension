console.log("Content script loaded successfully");

// Import modules
import { CONTROL_PANEL } from "./types/types";
import { createFloatPanel } from "./panels/panelFactory";
import { setupWindowMessageHandler } from "./panels/messaging";
import {
  initializeCaptionModule,
  handleCaptionMessages,
  cleanupCaptionModule,
  triggerAutoSave,
} from "./captionIntegration";

/**
 * Loads CSS file with error handling
 */
function loadCSS(filename: string): void {
  try {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = chrome.runtime.getURL(filename);
    link.onerror = () => console.warn(`Failed to load ${filename}`);
    document.head.appendChild(link);
  } catch (error) {
    console.warn(`Error loading ${filename}:`, error);
  }
}

/**
 * Initialize content script
 */
function initializeContentScript(): void {
  // Load CSS files in correct order
  loadCSS("index.css");
  loadCSS("notification.css");
  loadCSS("panel.css");

  // Setup message handlers for panels
  setupWindowMessageHandler();
  createFloatPanel(CONTROL_PANEL);

  // Setup caption message handler
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleCaptionMessages(message, sender, sendResponse).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  });

  // Setup event listeners
  window.addEventListener("beforeunload", async () => {
    await triggerAutoSave();
    cleanupCaptionModule();
  });
  window.addEventListener("unload", cleanupCaptionModule);

  // Initialize caption module after DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeCaptionModule);
  } else {
    initializeCaptionModule();
  }
}

// Initialize content script
initializeContentScript();
