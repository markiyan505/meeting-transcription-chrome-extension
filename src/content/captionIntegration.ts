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
import { CaptionManager } from "./caption/CaptionManager";
import { showCaptionNotification } from "./uiNotifier";

// Глобальні змінні
// let captionManager: CaptionManager | null = null;
let captionManager: any = null;
let isCaptionModuleInitialized = false;
let backupInterval: NodeJS.Timeout | null = null;
const BACKUP_INTERVAL_MS = 30000; // 30 секунд

/**
 * Ініціалізує модуль субтитрів
 */
export async function initializeCaptionModule() {
  try {
    logCaptionEvent("initialization_started", { url: window.location.href });

    let isErrorNotificationShown = false;

    function handleErrorOnce(details: any) {
      if (!isErrorNotificationShown) {
        console.error(
          `A critical error occurred in ${details.context}:`,
          details.error
        );
        isErrorNotificationShown = true;
      }
    }

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

    captionManager.on("error", handleErrorOnce);

    // Перевіряємо та відновлюємо бекап при вході в зустріч
    await checkAndRecoverBackup();

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

    // Запускаємо періодичні бекапи
    startPeriodicBackups();
  });

  // Обробник увімкнення субтитрів
  captionManager.on("captions_enabled", (data: any) => {
    console.log("📝 [CAPTIONS ENABLED]", {
      timestamp: data.timestamp,
      platform: getCurrentPlatformInfo().name,
    });

    logCaptionEvent("captions_enabled", data);
    showCaptionNotification("Captions enabled", "success");
  });

  // Обробник вимкнення субтитрів
  captionManager.on("captions_disabled", (data: any) => {
    console.log("📝 [CAPTIONS DISABLED]", {
      timestamp: data.timestamp,
      platform: getCurrentPlatformInfo().name,
    });

    logCaptionEvent("captions_disabled", data);
    showCaptionNotification("Captions disabled", "warning");
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

    // Зупиняємо періодичні бекапи
    stopPeriodicBackups();

    // Автоматичне збереження (перевірка даних буде в saveCaptionDataToBackground)
    (async () => {
      await saveCaptionDataToBackground(data);
    })();
  });

  captionManager.on("recording_paused", (data: any) => {
    console.log("⏸️ [RECORDING PAUSED]", {
      timestamp: data.timestamp,
      currentCaptionCount: captionManager.getCaptions().length,
    });

    logCaptionEvent("recording_paused", data);
    showCaptionNotification("Recording paused", "warning");

    // Зупиняємо періодичні бекапи при паузі
    stopPeriodicBackups();
  });

  captionManager.on("recording_resumed", (data: any) => {
    console.log("▶️ [RECORDING RESUMED]", {
      timestamp: data.timestamp,
      currentCaptionCount: captionManager.getCaptions().length,
    });

    logCaptionEvent("recording_resumed", data);
    showCaptionNotification("Recording resumed", "info");

    // Відновлюємо періодичні бекапи при резюме
    startPeriodicBackups();
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
 * Оновлює статус бейджа розширення
 */
// let lastBadgeStatus: boolean | null = null;

function updateBadgeStatus(isRecording: boolean) {
  // Уникаємо дублікатів повідомлень
  // if (lastBadgeStatus === isRecording) {
  //   return;
  // }

  // lastBadgeStatus = isRecording;

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
 * Створює бекап поточних даних сесії
 */
async function backupCurrentSession() {
  if (!captionManager || !isCaptionModuleInitialized) {
    return;
  }

  try {
    const captions = captionManager.getCaptions();
    const chatMessages = captionManager.getChatMessages();
    const meetingInfo = captionManager.getMeetingInfo();
    const recordingState = await captionManager.getRecordingState();

    // Отримуємо attendeeReport якщо доступний
    let attendeeReport = null;
    try {
      if (captionManager.getAttendeeReport) {
        attendeeReport = await captionManager.getAttendeeReport();
      }
    } catch (error) {
      console.warn("⚠️ [BACKUP] Could not get attendee report:", error);
    }

    const backupData = {
      captions,
      chatMessages,
      meetingInfo,
      attendeeReport,
      recordingState,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      title: document.title,
    };

    const response = await chrome.runtime.sendMessage({
      type: "backup_caption_data",
      data: backupData,
    });

    if (response?.success) {
      console.log("💾 [BACKUP] Session data backed up successfully", {
        captionCount: captions.length,
        chatMessageCount: chatMessages.length,
        timestamp: backupData.timestamp,
        backupId: response.backupId,
      });
    } else {
      console.error("❌ [BACKUP] Backup failed:", response?.error);
    }
  } catch (error) {
    console.error("❌ [BACKUP] Failed to backup session data:", error);
  }
}

/**
 * Запускає періодичні бекапи
 */
function startPeriodicBackups() {
  if (backupInterval) {
    clearInterval(backupInterval);
  }

  backupInterval = setInterval(() => {
    backupCurrentSession();
  }, BACKUP_INTERVAL_MS);

  console.log("🔄 [BACKUP] Periodic backups started (every 30 seconds)");
}

/**
 * Зупиняє періодичні бекапи
 */
function stopPeriodicBackups() {
  if (backupInterval) {
    clearInterval(backupInterval);
    backupInterval = null;
    console.log("⏹️ [BACKUP] Periodic backups stopped");
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
      warning: result.warning,
    });

    // Показуємо попередження про субтитри, якщо є
    if (result.warning) {
      showCaptionNotification(result.warning, "warning");
    }

    sendResponse({
      success: result.success,
      data: result,
      error: result.error,
      warning: result.warning,
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
      // Зупиняємо періодичні бекапи
      stopPeriodicBackups();

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
 * Примусово створює бекап поточної сесії. Використовується при закритті вкладки.
 * Зберігає дані в BACKUP для можливого продовження запису.
 */
export async function triggerAutoSave() {
  if (captionManager) {
    const state = await captionManager.getRecordingState();
    if ((state.isRecording || state.isPaused) && state.captionCount > 0) {
      console.log("Triggering backup on page unload...");
      await backupCurrentSession();

      // Додаємо бекап в історію як останній запис
      await addBackupToHistory();
    }
  }
}

/**
 * Додає бекап в історію як останній запис
 */
async function addBackupToHistory() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: "add_backup_to_history",
    });

    if (response?.success) {
      if (response.skipped) {
        console.log("⚠️ [BACKUP] Backup skipped (no data):", response.reason);
      } else {
        console.log("✅ [BACKUP] Backup added to history");
      }
    } else {
      console.error(
        "❌ [BACKUP] Failed to add backup to history:",
        response?.error
      );
    }
  } catch (error) {
    console.error("❌ [BACKUP] Failed to add backup to history:", error);
  }
}

/**
 * Перевіряє та відновлює бекап при вході в зустріч
 */
export async function checkAndRecoverBackup() {
  try {
    console.log("🔄 [RECOVERY] Checking backup recovery...");

    const response = await chrome.runtime.sendMessage({
      type: "check_backup_recovery",
      currentUrl: window.location.href,
    });

    console.log("🔄 [RECOVERY] Backup recovery response:", response);

    if (response?.success && response.shouldRecover) {
      console.log("🔄 [RECOVERY] Recovering backup for same meeting:", {
        source: response.source,
        captionCount: response.data?.captions?.length || 0,
        meetingUrl: response.data?.url,
      });

      // Відновлюємо дані
      if (captionManager) {
        captionManager.hydrate(response.data);
        if (response.data?.captions?.length) {
          showCaptionNotification(
            `Recovered ${
              response.data?.captions?.length || 0
            } captions from previous session`,
            "success"
          );
        }
      }
    } else if (response?.success && response.clearedBackup) {
      console.log("🧹 [CLEANUP] Cleared backup for different meeting");
    } else {
      console.log("🔄 [RECOVERY] No backup recovery");
    }
  } catch (error) {
    console.error("❌ [RECOVERY] Failed to check backup recovery:", error);
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

let lastSaveTime = 0;
const SAVE_DEBOUNCE_MS = 1000; // 1 секунда

async function saveCaptionDataToBackground(data: any) {
  // Уникаємо дублікатів збереження
  const now = Date.now();
  if (now - lastSaveTime < SAVE_DEBOUNCE_MS) {
    console.log("⏭️ [SAVE] Skipping duplicate save request");
    return;
  }
  lastSaveTime = now;

  try {
    const captions = captionManager.getCaptions();
    const chatMessages = captionManager.getChatMessages();
    const meetingInfo = captionManager.getMeetingInfo();
    const recordingState = await captionManager.getRecordingState();

    const response = await chrome.runtime.sendMessage({
      type: "save_caption_data",
      captions: captions,
      chatMessages: chatMessages,
      meetingInfo: meetingInfo,
      attendeeReport: data.attendeeReport || null,
      recordingState: recordingState,
    });

    if (response?.success) {
      console.log("✅ [SAVE] Caption data saved automatically");
    } else if (response?.skipped) {
      console.log("⚠️ [SAVE] Recording skipped (no data):", response.reason);

      // Показуємо повідомлення користувачу
      showCaptionNotification(
        response.message || "No data to save. Recording was empty.",
        "warning"
      );
    } else {
      console.error("❌ [SAVE] Failed to save caption data:", response?.error);

      // Показуємо повідомлення про помилку
      showCaptionNotification(
        `Failed to save recording: ${response?.error || "Unknown error"}`,
        "error"
      );
    }
  } catch (error) {
    console.error("❌ [SAVE] Failed to save caption data:", error);

    // Показуємо повідомлення про помилку
    showCaptionNotification(
      `Failed to save recording: ${
        error instanceof Error ? error.message : String(error)
      }`,
      "error"
    );
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
