// Background service worker for Chrome extension
console.log("Background script loaded");

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log("Extension installed:", details);

  // Set default settings
  chrome.storage.local.set({
    extensionActive: true,
    theme: "light",
    autoOpen: true,
    floatPanelVisible: true,
  });
});

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    console.log("Tab updated:", tab.url);

    // Inject content script if needed
    chrome.scripting
      .executeScript({
        target: { tabId },
        files: ["content.js"],
      })
      .catch((error) => {
        console.log("Could not inject content script:", error);
      });
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log("Background received message:", message);

  switch (message.type) {
    case "GET_CURRENT_TAB":
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        sendResponse(tabs[0]);
      });
      return true; // Keep message channel open

    case "TOGGLE_FLOAT_PANEL":
      chrome.storage.local.get(["floatPanelVisible"], (result) => {
        const newValue = !result.floatPanelVisible;
        chrome.storage.local.set({ floatPanelVisible: newValue });
        sendResponse({ visible: newValue });
      });
      return true; // Keep message channel open

    case "UPDATE_SETTINGS":
      chrome.storage.local.set(message.settings, () => {
        sendResponse({ success: true });
      });
      return true; // Keep message channel open

    default:
      sendResponse({ error: "Unknown message type" });
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  console.log("Extension icon clicked");

  // Toggle extension state
  chrome.storage.local.get(["extensionActive"], (result) => {
    const newState = !result.extensionActive;
    chrome.storage.local.set({ extensionActive: newState });

    // Update badge
    chrome.action.setBadgeText({
      text: newState ? "ON" : "",
      tabId: tab.id,
    });

    chrome.action.setBadgeBackgroundColor({
      color: newState ? "#10b981" : "#ef4444",
      tabId: tab.id,
    });
  });
});
