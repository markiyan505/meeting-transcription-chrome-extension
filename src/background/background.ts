// Background service worker for Chrome extension
console.log("Background script loaded");

// Caption data storage keys
const CAPTION_STORAGE_KEYS = {
  HISTORY: "captionHistory",
  CURRENT_SESSION: "currentCaptionSession",
  SETTINGS: "captionSettings",
} as const;

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

    // Caption module messages
    case "update_badge_status":
      handleBadgeStatusUpdate(message, _sender);
      sendResponse({ success: true });
      break;

    case "save_caption_data":
      handleSaveCaptionData(message, _sender, sendResponse);
      return true; // Keep message channel open

    case "get_caption_history":
      handleGetCaptionHistory(sendResponse);
      return true; // Keep message channel open

    case "clear_caption_history":
      handleClearCaptionHistory(sendResponse);
      return true; // Keep message channel open

    case "export_caption_data":
      handleExportCaptionData(message, _sender, sendResponse);
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

// Caption module handlers
function handleBadgeStatusUpdate(
  message: any,
  sender: chrome.runtime.MessageSender
) {
  if (sender.tab?.id) {
    chrome.action.setBadgeText({
      text: message.isRecording ? "REC" : "",
      tabId: sender.tab.id,
    });

    chrome.action.setBadgeBackgroundColor({
      color: message.isRecording ? "#f59e0b" : "#10b981",
      tabId: sender.tab.id,
    });
  }
}

async function handleSaveCaptionData(
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: any) => void
) {
  try {
    const sessionData = {
      id: generateSessionId(),
      timestamp: new Date().toISOString(),
      url: sender.tab?.url || "unknown",
      title: sender.tab?.title || "Unknown Meeting",
      captions: message.captions || [],
      chatMessages: message.chatMessages || [],
      meetingInfo: message.meetingInfo || {},
      attendeeReport: message.attendeeReport || null,
    };

    // Save current session
    await chrome.storage.local.set({
      [CAPTION_STORAGE_KEYS.CURRENT_SESSION]: sessionData,
    });

    // Add to history
    const { [CAPTION_STORAGE_KEYS.HISTORY]: history = [] } =
      await chrome.storage.local.get(CAPTION_STORAGE_KEYS.HISTORY);
    const updatedHistory = [sessionData, ...history].slice(0, 50); // Keep last 50 sessions

    await chrome.storage.local.set({
      [CAPTION_STORAGE_KEYS.HISTORY]: updatedHistory,
    });

    console.log("Caption data saved:", sessionData.id);
    sendResponse({ success: true, sessionId: sessionData.id });
  } catch (error) {
    console.error("Failed to save caption data:", error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function handleGetCaptionHistory(sendResponse: (response: any) => void) {
  try {
    const { [CAPTION_STORAGE_KEYS.HISTORY]: history = [] } =
      await chrome.storage.local.get(CAPTION_STORAGE_KEYS.HISTORY);
    sendResponse({ success: true, data: history });
  } catch (error) {
    console.error("Failed to get caption history:", error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function handleClearCaptionHistory(
  sendResponse: (response: any) => void
) {
  try {
    await chrome.storage.local.remove([
      CAPTION_STORAGE_KEYS.HISTORY,
      CAPTION_STORAGE_KEYS.CURRENT_SESSION,
    ]);
    console.log("Caption history cleared");
    sendResponse({ success: true });
  } catch (error) {
    console.error("Failed to clear caption history:", error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function handleExportCaptionData(
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: any) => void
) {
  try {
    const { sessionId, format = "json" } = message;

    let sessionData;
    if (sessionId) {
      // Get specific session from history
      const { [CAPTION_STORAGE_KEYS.HISTORY]: history = [] } =
        await chrome.storage.local.get(CAPTION_STORAGE_KEYS.HISTORY);
      sessionData = history.find((session: any) => session.id === sessionId);
    } else {
      // Get current session
      const { [CAPTION_STORAGE_KEYS.CURRENT_SESSION]: current } =
        await chrome.storage.local.get(CAPTION_STORAGE_KEYS.CURRENT_SESSION);
      sessionData = current;
    }

    if (!sessionData) {
      sendResponse({ success: false, error: "Session not found" });
      return;
    }

    const exportData = formatCaptionData(sessionData, format);
    const blob = new Blob([exportData.content], { type: exportData.mimeType });
    const url = URL.createObjectURL(blob);

    // Trigger download
    chrome.downloads.download({
      url: url,
      filename: exportData.filename,
      saveAs: true,
    });

    sendResponse({ success: true, filename: exportData.filename });
  } catch (error) {
    console.error("Failed to export caption data:", error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function formatCaptionData(sessionData: any, format: string) {
  const timestamp = new Date(sessionData.timestamp)
    .toISOString()
    .replace(/[:.]/g, "-");
  const baseFilename = `captions_${timestamp}`;

  switch (format.toLowerCase()) {
    case "json":
      return {
        content: JSON.stringify(sessionData, null, 2),
        mimeType: "application/json",
        filename: `${baseFilename}.json`,
      };

    case "txt":
      const txtContent = sessionData.captions
        .map(
          (caption: any) =>
            `[${caption.timestamp}] ${caption.speaker}: ${caption.text}`
        )
        .join("\n");
      return {
        content: txtContent,
        mimeType: "text/plain",
        filename: `${baseFilename}.txt`,
      };

    case "srt":
      const srtContent = sessionData.captions
        .map((caption: any, index: number) => {
          const startTime = formatSRTTime(new Date(caption.timestamp));
          const endTime = formatSRTTime(
            new Date(new Date(caption.timestamp).getTime() + 3000)
          ); // 3 seconds duration
          return `${index + 1}\n${startTime} --> ${endTime}\n${
            caption.speaker
          }: ${caption.text}\n`;
        })
        .join("\n");
      return {
        content: srtContent,
        mimeType: "text/plain",
        filename: `${baseFilename}.srt`,
      };

    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

function formatSRTTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const milliseconds = date.getMilliseconds().toString().padStart(3, "0");
  return `${hours}:${minutes}:${seconds},${milliseconds}`;
}

function generateSessionId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
