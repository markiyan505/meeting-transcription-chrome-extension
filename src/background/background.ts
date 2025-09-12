// Background service worker for Chrome extension
console.log("Background script loaded");

// Caption data storage keys
const CAPTION_STORAGE_KEYS = {
  HISTORY: "captionHistory",
  LAST_SESSION: "currentCaptionSession",
  SETTINGS: "captionSettings",
  BACKUP: "captionBackup",
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

    case "backup_caption_data":
      handleBackupCaptionData(message, _sender, sendResponse);
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

    case "add_backup_to_history":
      handleAddBackupToHistory(sendResponse);
      return true; // Keep message channel open

    case "check_backup_recovery":
      handleCheckBackupRecovery(message, _sender, sendResponse);
      return true; // Keep message channel open

    case "cleanup_empty_history":
      cleanupEmptyHistoryEntries();
      sendResponse({ success: true });
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
    const sessionData = createSessionData(message, sender, false);

    // Перевіряємо, чи є в записі хоча б якісь дані
    if (!hasBackupData(sessionData)) {
      console.log("⚠️ [SAVE] Session contains no data, skipping save:", {
        id: sessionData.id,
        captions: sessionData.captions?.length || 0,
        chatMessages: sessionData.chatMessages?.length || 0,
        attendeeReport: !!sessionData.attendeeReport,
        meetingInfo: !!sessionData.meetingInfo,
      });

      sendResponse({
        success: false,
        skipped: true,
        reason: "No data in session",
        message: "No data to save. Recording was empty.",
      });
      return;
    }

    // Save current session
    await chrome.storage.local.set({
      [CAPTION_STORAGE_KEYS.LAST_SESSION]: sessionData,
    });

    // Add to history
    const { [CAPTION_STORAGE_KEYS.HISTORY]: history = [] } =
      await chrome.storage.local.get(CAPTION_STORAGE_KEYS.HISTORY);
    const updatedHistory = [sessionData, ...history].slice(0, 50); // Keep last 50 sessions

    await chrome.storage.local.set({
      [CAPTION_STORAGE_KEYS.HISTORY]: updatedHistory,
    });

    // Очищаємо бекап після успішного збереження
    await chrome.storage.local.remove(CAPTION_STORAGE_KEYS.BACKUP);

    console.log("✅ [SAVE] Caption data saved:", {
      id: sessionData.id,
      captions: sessionData.captions?.length || 0,
      chatMessages: sessionData.chatMessages?.length || 0,
      attendeeReport: !!sessionData.attendeeReport,
      meetingInfo: !!sessionData.meetingInfo,
    });
    sendResponse({ success: true, sessionId: sessionData.id });
  } catch (error) {
    console.error("❌ [SAVE] Failed to save caption data:", error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function handleBackupCaptionData(
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: any) => void
) {
  try {
    const backupData = createSessionData(message, sender, true);

    // Зберігаємо бекап, замінюючи попередній бекап для цієї сесії
    await chrome.storage.local.set({
      [CAPTION_STORAGE_KEYS.BACKUP]: backupData,
    });

    console.log("💾 [BACKUP] Caption data backed up:", {
      id: backupData.id,
      captionCount: backupData.captions.length,
      chatMessageCount: backupData.chatMessages.length,
      timestamp: backupData.timestamp,
    });

    sendResponse({ success: true, backupId: backupData.id });
  } catch (error) {
    console.error("❌ [BACKUP] Failed to backup caption data:", error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function handleGetRecoveryData(sendResponse: (response: any) => void) {
  try {
    // Спочатку перевіряємо наявність бекапу
    const { [CAPTION_STORAGE_KEYS.BACKUP]: backupData } =
      await chrome.storage.local.get(CAPTION_STORAGE_KEYS.BACKUP);

    if (backupData) {
      console.log("🔄 [RECOVERY] Found backup data:", {
        id: backupData.id,
        captionCount: backupData.captions?.length || 0,
        chatMessageCount: backupData.chatMessages?.length || 0,
        timestamp: backupData.timestamp,
      });

      sendResponse({
        success: true,
        shouldRecover: true,
        data: backupData,
        source: "backup",
      });
      return;
    }

    // Немає даних для відновлення
    console.log("🔄 [RECOVERY] No data found for recovery");
    sendResponse({
      success: true,
      shouldRecover: false,
      data: null,
      source: "none",
    });
  } catch (error) {
    console.error("❌ [RECOVERY] Failed to get recovery data:", error);
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
      CAPTION_STORAGE_KEYS.LAST_SESSION,
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
      const { [CAPTION_STORAGE_KEYS.LAST_SESSION]: current } =
        await chrome.storage.local.get(CAPTION_STORAGE_KEYS.LAST_SESSION);
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

/**
 * Створює уніфіковані дані сесії для збереження або бекапу
 */
function createSessionData(
  message: any,
  sender: chrome.runtime.MessageSender,
  isBackup: boolean = false
) {
  const baseData = {
    id: generateSessionId(),
    timestamp: new Date().toISOString(),
    url: sender.tab?.url || message.data?.url || message.url || "unknown",
    title:
      sender.tab?.title ||
      message.data?.title ||
      message.title ||
      "Unknown Meeting",
    captions: message.data?.captions || message.captions || [],
    chatMessages: message.data?.chatMessages || message.chatMessages || [],
    meetingInfo: message.data?.meetingInfo || message.meetingInfo || {},
    attendeeReport:
      message.data?.attendeeReport || message.attendeeReport || null,
    recordingState:
      message.data?.recordingState ||
      message.recordingState ||
      (isBackup ? "unknown" : "recording"),
  };

  if (isBackup) {
    return {
      ...baseData,
      isBackup: true,
    };
  }

  return baseData;
}

/**
 * Перевіряє, чи містить бекап хоча б якісь дані
 */
function hasBackupData(backupData: any): boolean {
  if (!backupData) return false;

  const hasCaptions = backupData.captions && backupData.captions.length > 0;
  const hasChatMessages =
    backupData.chatMessages && backupData.chatMessages.length > 0;
  const hasAttendeeReport =
    backupData.attendeeReport &&
    (backupData.attendeeReport.attendeeList?.length > 0 ||
      backupData.attendeeReport.currentAttendees?.length > 0);
  // const hasMeetingInfo =
  //   backupData.meetingInfo &&
  //   Object.keys(backupData.meetingInfo).length > 0 &&
  //   (backupData.meetingInfo.title?.trim() ||
  //     backupData.meetingInfo.attendees?.length > 0);

  // return hasCaptions || hasChatMessages || hasAttendeeReport || hasMeetingInfo;
  return hasCaptions || hasChatMessages || hasAttendeeReport;
}

/**
 * Додає бекап в історію як останній запис (тільки якщо є дані)
 */
async function handleAddBackupToHistory(sendResponse: (response: any) => void) {
  try {
    const { [CAPTION_STORAGE_KEYS.BACKUP]: backupData } =
      await chrome.storage.local.get(CAPTION_STORAGE_KEYS.BACKUP);

    if (!backupData) {
      sendResponse({ success: false, error: "No backup data found" });
      return;
    }

    // Перевіряємо, чи є в бекапі хоча б якісь дані
    if (!hasBackupData(backupData)) {
      console.log("⚠️ [BACKUP] Backup contains no data, skipping history:", {
        id: backupData.id,
        captions: backupData.captions?.length || 0,
        chatMessages: backupData.chatMessages?.length || 0,
        attendeeReport: !!backupData.attendeeReport,
        meetingInfo: !!backupData.meetingInfo,
      });
      sendResponse({
        success: true,
        skipped: true,
        reason: "No data in backup",
      });
      return;
    }

    // Додаємо бекап в історію
    const { [CAPTION_STORAGE_KEYS.HISTORY]: history = [] } =
      await chrome.storage.local.get(CAPTION_STORAGE_KEYS.HISTORY);

    const updatedHistory = [backupData, ...history].slice(0, 50);

    await chrome.storage.local.set({
      [CAPTION_STORAGE_KEYS.HISTORY]: updatedHistory,
    });

    console.log("✅ [BACKUP] Backup added to history:", {
      id: backupData.id,
      captions: backupData.captions?.length || 0,
      chatMessages: backupData.chatMessages?.length || 0,
      attendeeReport: !!backupData.attendeeReport,
      meetingInfo: !!backupData.meetingInfo,
    });
    sendResponse({ success: true });
  } catch (error) {
    console.error("❌ [BACKUP] Failed to add backup to history:", error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Перевіряє та відновлює бекап при вході в зустріч
 */
async function handleCheckBackupRecovery(
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: any) => void
) {
  try {
    const { [CAPTION_STORAGE_KEYS.BACKUP]: backupData } =
      await chrome.storage.local.get(CAPTION_STORAGE_KEYS.BACKUP);

    if (!backupData) {
      sendResponse({ success: true, shouldRecover: false });
      return;
    }

    const currentUrl = message.currentUrl || sender.tab?.url || "unknown";
    const backupUrl = backupData.url;

    // Перевіряємо, чи це та ж зустріч (порівнюємо URL)
    const isSameMeeting = isSameMeetingUrl(currentUrl, backupUrl);

    if (isSameMeeting) {
      await removeBackupFromHistory(backupData.id);

      console.log("🔄 [RECOVERY] Recovering backup for same meeting:", {
        currentUrl,
        backupUrl,
        captionCount: backupData.captions?.length || 0,
      });

      sendResponse({
        success: true,
        shouldRecover: true,
        data: backupData,
        source: "backup",
      });
    } else {
      // Інша зустріч - просто видаляємо бекап
      await chrome.storage.local.remove(CAPTION_STORAGE_KEYS.BACKUP);

      console.log("🧹 [CLEANUP] Cleared backup for different meeting:", {
        currentUrl,
        backupUrl,
      });

      sendResponse({
        success: true,
        shouldRecover: false,
        clearedBackup: true,
      });
    }
  } catch (error) {
    console.error("❌ [RECOVERY] Failed to check backup recovery:", error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Перевіряє, чи це та ж зустріч за URL
 */
function isSameMeetingUrl(currentUrl: string, backupUrl: string): boolean {
  try {
    const current = new URL(currentUrl);
    const backup = new URL(backupUrl);

    // Порівнюємо домен та шлях (без query параметрів)
    return (
      current.hostname === backup.hostname &&
      current.pathname === backup.pathname
    );
  } catch {
    return false;
  }
}

/**
 * Видаляє бекап з історії за ID
 */
async function removeBackupFromHistory(backupId: string) {
  const { [CAPTION_STORAGE_KEYS.HISTORY]: history = [] } =
    await chrome.storage.local.get(CAPTION_STORAGE_KEYS.HISTORY);

  const updatedHistory = history.filter(
    (session: any) => session.id !== backupId
  );

  await chrome.storage.local.set({
    [CAPTION_STORAGE_KEYS.HISTORY]: updatedHistory,
  });

  console.log("🗑️ [CLEANUP] Removed backup from history:", backupId);
}

/**
 * Очищає порожні записи з історії
 */
async function cleanupEmptyHistoryEntries() {
  try {
    const { [CAPTION_STORAGE_KEYS.HISTORY]: history = [] } =
      await chrome.storage.local.get(CAPTION_STORAGE_KEYS.HISTORY);

    const cleanedHistory = history.filter((session: any) => {
      return hasBackupData(session);
    });

    if (cleanedHistory.length !== history.length) {
      await chrome.storage.local.set({
        [CAPTION_STORAGE_KEYS.HISTORY]: cleanedHistory,
      });

      console.log(
        `🧹 [CLEANUP] Removed ${
          history.length - cleanedHistory.length
        } empty entries from history`
      );
    }
  } catch (error) {
    console.error(
      "❌ [CLEANUP] Failed to cleanup empty history entries:",
      error
    );
  }
}
