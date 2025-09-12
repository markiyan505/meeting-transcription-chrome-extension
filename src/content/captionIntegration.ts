/**
 * Модуль інтеграції субтитрів для content script
 * Винесено з content.ts для покращення структури коду
 */

import {
  createCaptionManagerForCurrentPlatform,
  isCurrentPlatformSupported,
  getCurrentPlatformInfo,
  logCaptionEvent,
  handleCaptionError,
} from "./caption/index";

// Глобальні змінні
let captionManager: any = null;
let isCaptionModuleInitialized = false;

/**
 * Ініціалізує модуль субтитрів
 */
export async function initializeCaptionModule() {
  try {
    logCaptionEvent("initialization_started", { url: window.location.href });

    // Перевіряємо, чи підтримується поточна платформа
    if (!isCurrentPlatformSupported()) {
      const platformInfo = getCurrentPlatformInfo();
      console.warn(
        `Platform not supported: ${platformInfo.name} - ${platformInfo.description}`
      );
      return;
    }

    // Створюємо менеджер субтитрів
    captionManager = await createCaptionManagerForCurrentPlatform({
      autoEnableCaptions: true,
      autoSaveOnEnd: true,
      trackAttendees: true,
      operationMode: "automatic",
    });

    // Налаштовуємо обробники подій
    setupCaptionEventHandlers();

    isCaptionModuleInitialized = true;
    logCaptionEvent("initialization_completed", {
      platform: getCurrentPlatformInfo().name,
      adapter: captionManager.currentAdapter?.constructor.name,
    });

    // Показуємо повідомлення користувачу
    showCaptionNotification(
      "Caption module initialized successfully",
      "success"
    );
  } catch (error) {
    handleCaptionError(
      error instanceof Error ? error : new Error(String(error)),
      "initializeCaptionModule"
    );
    showCaptionNotification("Failed to initialize caption module", "error");
  }
}

/**
 * Налаштовує обробники подій для модуля субтитрів
 */
function setupCaptionEventHandlers() {
  if (!captionManager) return;

  // Обробники подій запису
  captionManager.on("recording_started", (data: any) => {
    console.log("🔴 [RECORDING STARTED]", {
      timestamp: data.timestamp,
      platform: getCurrentPlatformInfo().name,
      adapter: captionManager.currentAdapter?.constructor.name,
    });

    logCaptionEvent("recording_started", data);
    showCaptionNotification("Recording started", "info");
    updateBadgeStatus(true);
  });

  captionManager.on("recording_stopped", (data: any) => {
    console.log("⏹️ [RECORDING STOPPED]", {
      timestamp: data.timestamp,
      captionCount: data.captionCount,
      chatMessageCount: data.chatMessageCount,
      totalDuration: data.totalDuration,
    });

    // Показуємо статистику запису
    if (data.captionCount > 0) {
      console.log(
        `📊 [RECORDING STATS] Captured ${data.captionCount} captions`
      );

      // Показуємо останні 5 субтитрів
      const captions = captionManager.getCaptions();
      if (captions.length > 0) {
        console.log("📝 [LAST CAPTIONS]:");
        captions.slice(-5).forEach((caption: any, index: number) => {
          console.log(
            `  ${captions.length - 5 + index + 1}. ${caption.speaker}: "${
              caption.text
            }"`
          );
        });
      }
    }

    logCaptionEvent("recording_stopped", data);
    showCaptionNotification(
      `Recording stopped. Captured ${data.captionCount} captions`,
      "info"
    );
    updateBadgeStatus(false);

    // ДОДАТИ: Автоматичне збереження
    if (data.captionCount > 0) {
      saveCaptionDataToBackground(data);
    }
  });

  captionManager.on("recording_paused", (data: any) => {
    console.log("⏸️ [RECORDING PAUSED]", {
      timestamp: data.timestamp,
      currentCaptionCount: captionManager.getCaptions().length,
    });

    logCaptionEvent("recording_paused", data);
    showCaptionNotification("Recording paused", "warning");
  });

  captionManager.on("recording_resumed", (data: any) => {
    console.log("▶️ [RECORDING RESUMED]", {
      timestamp: data.timestamp,
      currentCaptionCount: captionManager.getCaptions().length,
    });

    logCaptionEvent("recording_resumed", data);
    showCaptionNotification("Recording resumed", "info");
  });

  // Обробники подій субтитрів
  captionManager.on("captions_enabled", (data: any) => {
    logCaptionEvent("captions_enabled", data);
    showCaptionNotification("Captions enabled", "success");
  });

  captionManager.on("captions_disabled", (data: any) => {
    logCaptionEvent("captions_disabled", data);
    showCaptionNotification("Captions disabled", "warning");
  });

  captionManager.on("caption_added", (data: any) => {
    // Розширене логування для нових субтитрів
    console.log("📝 [NEW CAPTION]", {
      speaker: data.speaker,
      text: data.text,
      timestamp: data.timestamp,
      textLength: data.text.length,
      id: data.id,
    });

    logCaptionEvent("caption_added", {
      speaker: data.speaker,
      textLength: data.text.length,
      text: data.text.substring(0, 100) + (data.text.length > 100 ? "..." : ""), // Перші 100 символів
    });

    // Показуємо субтитр в консолі з форматуванням
    console.log(`🎤 ${data.speaker}: "${data.text}"`);
  });

  captionManager.on("caption_updated", (data: any) => {
    // Розширене логування для оновлених субтитрів
    console.log("✏️ [UPDATED CAPTION]", {
      speaker: data.speaker,
      text: data.text,
      timestamp: data.timestamp,
      textLength: data.text.length,
      id: data.id,
    });

    logCaptionEvent("caption_updated", {
      speaker: data.speaker,
      textLength: data.text.length,
      text: data.text.substring(0, 100) + (data.text.length > 100 ? "..." : ""), // Перші 100 символів
    });

    // Показуємо оновлений субтитр в консолі
    console.log(`🔄 ${data.speaker}: "${data.text}"`);
  });

  // Обробники подій експорту
  captionManager.on("data_exported", (data: any) => {
    logCaptionEvent("data_exported", data);
    showCaptionNotification(`Data exported as ${data.format}`, "success");
  });

  captionManager.on("data_cleared", (data: any) => {
    logCaptionEvent("data_cleared", data);
    showCaptionNotification("Data cleared", "info");
  });
}

/**
 * Показує повідомлення користувачу про стан субтитрів
 */
function showCaptionNotification(
  message: string,
  type: "success" | "error" | "warning" | "info" = "info"
) {
  const notification = document.createElement("div");
  notification.className = `caption-notification caption-notification-${type}`;
  notification.textContent = message;

  // Стилі для повідомлень
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 16px;
    border-radius: 8px;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
  `;

  // Кольори для різних типів повідомлень
  const colors = {
    success: "#10B981",
    error: "#EF4444",
    warning: "#F59E0B",
    info: "#3B82F6",
  };

  notification.style.backgroundColor = colors[type] || colors.info;

  document.body.appendChild(notification);

  // Автоматично прибираємо повідомлення через 5 секунд
  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform = "translateX(100%)";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 5000);
}

/**
 * Оновлює статус бейджа розширення
 */
function updateBadgeStatus(isRecording: boolean) {
  try {
    chrome.runtime.sendMessage({
      type: "update_badge_status",
      isRecording: isRecording,
    });
  } catch (error) {
    // Ігноруємо помилки, якщо розширення не доступне
  }
}

/**
 * Обробляє повідомлення від інших частин розширення для субтитрів
 */
export function handleCaptionMessages(
  request: any,
  sender: any,
  sendResponse: any
) {
  if (!captionManager || !isCaptionModuleInitialized) {
    sendResponse({ success: false, error: "Caption module not initialized" });
    return;
  }

  switch (request.type) {
    case "get_caption_status":
      handleGetCaptionStatus(sendResponse);
      break;

    case "start_caption_recording":
      handleStartCaptionRecording(sendResponse);
      break;

    case "stop_caption_recording":
      handleStopCaptionRecording(sendResponse);
      break;

    case "pause_caption_recording":
      handlePauseCaptionRecording(sendResponse);
      break;

    case "resume_caption_recording":
      handleResumeCaptionRecording(sendResponse);
      break;

    case "enable_captions":
      handleEnableCaptions(sendResponse);
      break;

    case "disable_captions":
      handleDisableCaptions(sendResponse);
      break;

    case "export_caption_data":
      handleExportCaptionData(request, sendResponse);
      break;

    case "get_captions":
      handleGetCaptions(sendResponse);
      break;

    case "get_meeting_info":
      handleGetMeetingInfo(sendResponse);
      break;

    case "clear_caption_data":
      handleClearCaptionData(sendResponse);
      break;

    case "toggle_caption_subtitles":
      handleToggleCaptionSubtitles(request, sendResponse);
      break;

    case "update_badge_status":
      handleBadgeStatusUpdate(request, sender);
      sendResponse({ success: true });
      break;

    default:
      // Якщо це не повідомлення для субтитрів, передаємо далі
      return false;
  }

  return true; // Вказуємо, що повідомлення оброблено
}

/**
 * Обробник для перемикання субтитрів
 */
function handleToggleCaptionSubtitles(
  request: any,
  sendResponse: (response: any) => void
) {
  try {
    console.log("🎛️ [UI ACTION] Toggling subtitles...", {
      enabled: request.data?.enabled,
      currentState: captionManager?.getCaptions().length || 0,
    });

    if (!isCaptionModuleInitialized || !captionManager) {
      console.error("❌ [UI ACTION] Caption module not initialized");
      sendResponse({ success: false, error: "Caption module not initialized" });
      return;
    }

    const enabled = request.data?.enabled;
    if (enabled === undefined) {
      console.error("❌ [UI ACTION] Missing enabled parameter");
      sendResponse({ success: false, error: "Missing enabled parameter" });
      return;
    }

    // Тут можна додати логіку для перемикання субтитрів
    // Наприклад, показувати/ховати панель субтитрів
    if (enabled) {
      console.log("📺 [UI ACTION] Showing subtitles panel");
      showSubtitlesPanel();
    } else {
      console.log("📺 [UI ACTION] Hiding subtitles panel");
      hideSubtitlesPanel();
    }

    console.log(
      `✅ [UI ACTION] Subtitles ${
        enabled ? "enabled" : "disabled"
      } successfully`
    );
    logCaptionEvent("subtitles_toggled", { enabled });
    sendResponse({ success: true, enabled });
  } catch (error) {
    console.error("❌ [UI ACTION] Toggle subtitles failed:", error);
    logCaptionEvent("error", {
      type: "toggle_subtitles_failed",
      error: error instanceof Error ? error.message : String(error),
    });
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// Функції для керування панеллю субтитрів
function showSubtitlesPanel() {
  // Логіка показу панелі субтитрів
  console.log("📺 Showing subtitles panel");
  // Тут можна додати логіку для показу FloatPanelSubtitles
}

function hideSubtitlesPanel() {
  // Логіка приховування панелі субтитрів
  console.log("📺 Hiding subtitles panel");
  // Тут можна додати логіку для приховування FloatPanelSubtitles
}

/**
 * Обробники конкретних повідомлень для субтитрів
 */
async function handleGetCaptionStatus(sendResponse: any) {
  try {
    console.log("📊 [UI ACTION] Getting caption status...");

    const recordingState = await captionManager.getRecordingState();
    const isInMeeting = await captionManager.isInMeeting();
    const isCaptionsEnabled = await captionManager.isCaptionsEnabled();
    const captions = captionManager.getCaptions();
    const chatMessages = captionManager.getChatMessages();

    const status = {
      isInitialized: true,
      isInMeeting,
      isCaptionsEnabled,
      recordingState,
      platform: getCurrentPlatformInfo().name,
      captionCount: captions.length,
      chatMessageCount: chatMessages.length,
    };

    console.log("📊 [UI ACTION] Caption status:", status);

    sendResponse({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("❌ [UI ACTION] Get caption status failed:", error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function handleStartCaptionRecording(sendResponse: any) {
  try {
    console.log("🎬 [UI ACTION] Starting caption recording...");
    const result = await captionManager.startRecording();

    console.log("✅ [UI ACTION] Start recording result:", {
      success: result.success,
      message: result.message,
      error: result.error,
    });

    sendResponse({
      success: result.success,
      data: result,
      error: result.error,
    });
  } catch (error) {
    console.error("❌ [UI ACTION] Start recording failed:", error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function handleStopCaptionRecording(sendResponse: any) {
  try {
    console.log("⏹️ [UI ACTION] Stopping caption recording...");
    const result = await captionManager.stopRecording();

    console.log("✅ [UI ACTION] Stop recording result:", {
      success: result.success,
      message: result.message,
      error: result.error,
    });

    sendResponse({
      success: result.success,
      data: result,
      error: result.error,
    });
  } catch (error) {
    console.error("❌ [UI ACTION] Stop recording failed:", error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function handlePauseCaptionRecording(sendResponse: any) {
  try {
    console.log("⏸️ [UI ACTION] Pausing caption recording...");
    const result = await captionManager.pauseRecording();

    console.log("✅ [UI ACTION] Pause recording result:", {
      success: result.success,
      message: result.message,
      error: result.error,
    });

    sendResponse({
      success: result.success,
      data: result,
      error: result.error,
    });
  } catch (error) {
    console.error("❌ [UI ACTION] Pause recording failed:", error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function handleResumeCaptionRecording(sendResponse: any) {
  try {
    console.log("▶️ [UI ACTION] Resuming caption recording...");
    const result = await captionManager.resumeRecording();

    console.log("✅ [UI ACTION] Resume recording result:", {
      success: result.success,
      message: result.message,
      error: result.error,
    });

    sendResponse({
      success: result.success,
      data: result,
      error: result.error,
    });
  } catch (error) {
    console.error("❌ [UI ACTION] Resume recording failed:", error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function handleEnableCaptions(sendResponse: any) {
  try {
    const result = await captionManager.enableCaptions();
    sendResponse({
      success: result.success,
      data: result,
      error: result.error,
    });
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function handleDisableCaptions(sendResponse: any) {
  try {
    const result = await captionManager.disableCaptions();
    sendResponse({
      success: result.success,
      data: result,
      error: result.error,
    });
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function handleExportCaptionData(request: any, sendResponse: any) {
  try {
    const result = await captionManager.exportData(
      request.format,
      request.options
    );
    sendResponse(result);
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function handleGetCaptions(sendResponse: any) {
  try {
    const captions = captionManager.getCaptions();
    const chatMessages = captionManager.getChatMessages();

    sendResponse({
      success: true,
      data: {
        captions,
        chatMessages,
        count: captions.length,
      },
    });
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function handleGetMeetingInfo(sendResponse: any) {
  try {
    const meetingInfo = captionManager.getMeetingInfo();
    sendResponse({
      success: true,
      data: meetingInfo,
    });
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function handleClearCaptionData(sendResponse: any) {
  try {
    const result = await captionManager.clearData();
    sendResponse(result);
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Очищає ресурси при виході зі сторінки
 */
export async function cleanupCaptionModule() {
  if (captionManager) {
    try {
      await captionManager.cleanup();
      captionManager = null;
      isCaptionModuleInitialized = false;
      logCaptionEvent("cleanup_completed", {});
    } catch (error) {
      handleCaptionError(
        error instanceof Error ? error : new Error(String(error)),
        "cleanup"
      );
    }
  }
}

/**
 * Перевіряє, чи ініціалізований модуль субтитрів
 */
export function isCaptionModuleReady(): boolean {
  return isCaptionModuleInitialized && captionManager !== null;
}

/**
 * Отримує поточний менеджер субтитрів
 */
export function getCaptionManager(): any {
  return captionManager;
}

async function saveCaptionDataToBackground(data: any) {
  try {
    const captions = captionManager.getCaptions();
    const chatMessages = captionManager.getChatMessages();
    const meetingInfo = captionManager.getMeetingInfo();

    await chrome.runtime.sendMessage({
      type: "save_caption_data",
      captions: captions,
      chatMessages: chatMessages,
      meetingInfo: meetingInfo,
      attendeeReport: data.attendeeReport || null,
    });

    console.log("✅ Caption data saved automatically");
  } catch (error) {
    console.error("❌ Failed to save caption data:", error);
  }
}

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
