/**
 * Модуль інтеграції субтитрів для content script.
 * Виконує команди від background та звітує про зміни стану.
 */

import {
  createCaptionAdapterForCurrentPlatform,
  isCurrentPlatformSupported,
  getCurrentPlatformInfo,
  logCaptionEvent,
  handleCaptionError,
} from "./caption/index";
import { CaptionAdapter } from "./caption/types";
import { showCaptionNotification } from "./uiNotifier";
import { MessageType } from "@/types/messages";
import type { CaptionState } from "@/store/captionStore";
import { debounce } from "./caption/utils";
import { errorType } from "@/components/features/meet-control-panel/types";

// Глобальні змінні
// let captionAdapter: CaptionAdapter | null = null;
let captionAdapter: any;
let isCaptionModuleInitialized = false;
let isPanelVisible = true;
let backupInterval: ReturnType<typeof setInterval> | null = null;
const BACKUP_INTERVAL_MS = 30000;

// =======================================================
// ГОЛОВНА ЛОГІКА МОДУЛЯ
// =======================================================

/**
 * Синхронізує isPanelVisible з captionStore
 */
async function syncPanelVisibilityFromStore() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: MessageType.GET_CAPTION_STATUS,
    });
    if (response && typeof response.isPanelVisible === "boolean") {
      isPanelVisible = response.isPanelVisible;
      console.log(
        `🔄 [SYNC] isPanelVisible synced from store: ${isPanelVisible}`
      );
    }
  } catch (error) {
    console.warn("Failed to sync isPanelVisible from store:", error);
  }
}

/**
 * Обчислює чи повинна панель бути видимою
 * Панель видима тільки якщо: isPanelVisible = true AND isInMeeting = true
 */
async function shouldPanelBeVisible(): Promise<boolean> {
  if (!captionAdapter) return false;

  try {
    const isInMeeting = await captionAdapter.isInMeeting();
    return isPanelVisible && isInMeeting;
  } catch (error) {
    console.warn("Failed to check meeting state:", error);
    return false;
  }
}

/**
 * Ініціалізує модуль субтитрів на сторінці.
 */
export async function initializeCaptionModule() {
  try {
    // if (document.getElementById("caption-module-initialized")) {
    //   console.warn("Caption module already initialized. Skipping.");
    //   return;
    // }

    // Перевіряємо чи розширення ввімкнено
    try {
      const response = await chrome.runtime.sendMessage({
        type: MessageType.GET_CAPTION_STATUS,
      });
      if (response && response.isExtensionEnabled === false) {
        console.log("🔌 [INIT] Extension is disabled, skipping initialization");
        return;
      }
    } catch (error) {
      console.warn("Failed to check extension state:", error);
    }
    const initMarker = document.createElement("div");
    initMarker.id = "caption-module-initialized";
    document.body.appendChild(initMarker);

    logCaptionEvent("initialization_started", { url: window.location.href });

    if (!isCurrentPlatformSupported()) {
      console.warn("Platform not supported.");
      await reportStateToBackground();
      return;
    }

    // Створюємо та ініціалізуємо адаптер
    captionAdapter = await createCaptionAdapterForCurrentPlatform({
      autoEnableCaptions: true,
      autoSaveOnEnd: true,
      trackAttendees: true,
      operationMode: "automatic",
    });

    setupCaptionEventHandlers();

    isCaptionModuleInitialized = true;
    logCaptionEvent("initialization_completed", {
      platform: getCurrentPlatformInfo().name,
    });

    const isInMeeting = await captionAdapter.isInMeeting();
    console.log(`🔍 [INIT] isInMeeting: ${isInMeeting}`);

    // Синхронізуємо isPanelVisible з store
    await syncPanelVisibilityFromStore();

    // Даємо час панелі створитися перед оновленням видимості
    setTimeout(async () => {
      await updatePanelVisibility();
    }, 200);

    // Відправляємо перший звіт про стан у background
    await reportStateToBackground();

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
    // Повідомляємо background про помилку ініціалізації
    await reportStateToBackground(error);
  }
}

/**
 * Обробляє команди, що надходять від background script.
 */
export async function handleCaptionMessages(
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: any) => void
) {
  console.log("📨 [MESSAGE] Received message:", message);
  console.log(
    "📨 [MESSAGE] Sender ID:",
    sender.id,
    "Expected:",
    chrome.runtime.id
  );
  if (sender.id !== chrome.runtime.id) {
    sendResponse({ success: false, message: "Sender ID mismatch" });
    return;
  }

  console.log("📨 [MESSAGE] Sender ID verified, processing message...");

  try {
    // Дозволяємо обробку TOGGLE_EXTENSION_STATE навіть коли модуль не ініціалізований
    if (
      message.type !== MessageType.TOGGLE_EXTENSION_STATE &&
      message.type !== "GET_PLATFORM_INFO" &&
      (!isCaptionModuleInitialized || !captionAdapter)
    ) {
      sendResponse({
        success: false,
        error: "Caption module is not ready on this page.",
      });
      return;
    }

    let result: any = { success: true };
    try {
      if (
        message.type !== MessageType.TOGGLE_EXTENSION_STATE &&
        message.type !== "GET_PLATFORM_INFO"
      ) {
        if (!captionAdapter) {
          sendResponse({
            success: false,
            error: "Caption adapter not available",
          });
          return;
        }
      }

      console.log("🔄 [MESSAGE] Processing message type:", message.type);
      switch (message.type) {
        case MessageType.START_CAPTION_RECORDING:
          result = await captionAdapter.startRecording();
          break;
        case MessageType.STOP_CAPTION_RECORDING:
          result = await captionAdapter.stopRecording();
          break;
        case MessageType.PAUSE_CAPTION_RECORDING:
          result = await captionAdapter.pauseRecording();
          break;
        case MessageType.RESUME_CAPTION_RECORDING:
          result = await captionAdapter.resumeRecording();
          break;
        case MessageType.HARD_STOP_CAPTION_RECORDING:
          result = await captionAdapter.hardStopRecording();
          break;
        case MessageType.ENABLE_CAPTIONS:
          result = await captionAdapter.enableCaptions();
          break;
        case MessageType.DISABLE_CAPTIONS:
          result = await captionAdapter.disableCaptions();
          break;
        case MessageType.TOGGLE_EXTENSION_STATE:
          const isEnabled = message.isEnabled;

          if (!isEnabled) {
            await disableCaptionModule();
          } else {
            await reinitializeCaptionModule();
          }

          result = {
            success: true,
            message: `Extension ${isEnabled ? "enabled" : "disabled"}`,
            isEnabled: isEnabled,
          };
          console.log(
            "🔄 [MESSAGE] TOGGLE_EXTENSION_STATE processed successfully"
          );
          break;

        case MessageType.TOGGLE_PANEL_VISIBILITY:
          console.log("🔄 [MESSAGE] Processing TOGGLE_PANEL_VISIBILITY");
          // Перемикаємо стан isPanelVisible
          isPanelVisible = !isPanelVisible;
          console.log(
            `🔄 [MESSAGE] isPanelVisible changed to: ${isPanelVisible}`
          );
          // Оновлюємо видимість панелі (автоматично враховує isInMeeting)
          await updatePanelVisibility();
          result = {
            success: true,
            message: `Panel ${isPanelVisible ? "enabled" : "disabled"}`,
          };
          console.log(
            "🔄 [MESSAGE] TOGGLE_PANEL_VISIBILITY processed successfully"
          );
          break;

        case "GET_PLATFORM_INFO":
          console.log("🔄 [MESSAGE] Processing GET_PLATFORM_INFO");
          try {
            const platformInfo = getCurrentPlatformInfo();
            const isSupported = isCurrentPlatformSupported();
            console.log("🔄 [MESSAGE] Platform info:", {
              platform: platformInfo.name,
              isSupported: isSupported,
              hostname: window.location.hostname,
            });
            result = {
              success: true,
              isSupportedPlatform: isSupported,
              currentPlatform: platformInfo.name,
            };
            console.log("🔄 [MESSAGE] GET_PLATFORM_INFO result:", result);
          } catch (error) {
            console.error("🔄 [MESSAGE] Error getting platform info:", error);
            result = {
              success: true,
              isSupportedPlatform: false,
              currentPlatform: "unknown",
              error: error instanceof Error ? error.message : String(error),
            };
            console.log("🔄 [MESSAGE] GET_PLATFORM_INFO error result:", result);
          }
          break;
        default:
          console.log("🔄 [MESSAGE] Unknown message type:", message.type);
          result = {
            success: false,
            error: `Unknown message type: ${message.type}`,
          };
          break;
      }
      if (result.warning) {
        showCaptionNotification(result.warning, "warning");
      }

      // Не викликаємо reportStateToBackground для GET_PLATFORM_INFO щоб уникнути циклу
      if (message.type !== "GET_PLATFORM_INFO") {
        await reportStateToBackground();
      }

      console.log(
        "🔄 [MESSAGE] Sending response for",
        message.type,
        ":",
        result
      );
      sendResponse(result);
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Налаштовує обробники подій від адаптера для звітування у background.
 */
function setupCaptionEventHandlers() {
  if (!captionAdapter) return;

  captionAdapter.on("meeting_started", async (data: any) => {
    logCaptionEvent("meeting_started", data);
    showCaptionNotification("Meeting started", "info");
    reportStateToBackground();
    await updatePanelVisibility();
    await checkAndRecoverBackup();
  });

  captionAdapter.on("meeting_ended", async (data: any) => {
    logCaptionEvent("meeting_ended", data);
    showCaptionNotification("Meeting ended", "info");
    reportStateToBackground();
    await updatePanelVisibility(false);
    stopPeriodicBackups();
  });

  captionAdapter.on("hydrated", (data: any) => {
    logCaptionEvent("hydrated", data);
    showCaptionNotification("State recovered from previous session", "success");
  });

  captionAdapter.on("data_cleared", (data: any) => {
    logCaptionEvent("data_cleared", data);
  });

  captionAdapter.on("error", (data: any) => {
    logCaptionEvent("error", data);
  });

  captionAdapter.on("recording_started", (data: any) => {
    logCaptionEvent("recording_started", data);
    showCaptionNotification("Recording started", "info");

    startPeriodicBackups();
  });

  captionAdapter.on("captions_enabled", (data: any) => {
    logCaptionEvent("captions_enabled", data);
    showCaptionNotification("Captions enabled", "success");
  });

  captionAdapter.on("captions_disabled", (data: any) => {
    logCaptionEvent("captions_disabled", data);
    showCaptionNotification("Captions disabled", "warning");
  });

  captionAdapter.on("recording_hard_stopped", (data: any) => {
    logCaptionEvent("recording_hard_stopped", data);
    showCaptionNotification("Recording deleted", "warning");

    stopPeriodicBackups();

    chrome.runtime.sendMessage({
      type: "clear_caption_backup",
    });
  });

  captionAdapter.on("recording_stopped", (data: any) => {
    logCaptionEvent("recording_stopped", data);
    showCaptionNotification("Recording stopped", "info");

    stopPeriodicBackups();

    console.log(`[RECORDING STOPPED] Captured ${data.captionCount} captions`);

    saveCaptionDataToBackground(data);
  });

  captionAdapter.on("recording_paused", (data: any) => {
    console.log("⏸️ [RECORDING PAUSED]", {
      timestamp: data.timestamp,
      currentCaptionCount: captionAdapter?.getCaptions().length || 0,
    });

    logCaptionEvent("recording_paused", data);
    showCaptionNotification("Recording paused", "warning");

    stopPeriodicBackups();
  });

  captionAdapter.on("recording_resumed", (data: any) => {
    logCaptionEvent("recording_resumed", data);
    showCaptionNotification("Recording resumed", "info");

    startPeriodicBackups();
  });

  captionAdapter.on("caption_added", (data: any) => {
    logCaptionEvent("caption_added", data);
  });

  captionAdapter.on("caption_updated", (data: any) => {
    logCaptionEvent("caption_updated", data);
  });

  captionAdapter.on("attendees_updated", (data: any) => {
    logCaptionEvent("attendees_updated", data);
  });
}

// =======================================================
// КОМУНІКАЦІЯ З BACKGROUND SCRIPT
// =======================================================

/**
 * Збирає поточний стан і відправляє його у background.
 */
async function reportStateToBackground(errorSource?: unknown) {
  let statePayload: Partial<CaptionState>;
  const lastKnownState = await getSafeLastKnownState();

  // Отримуємо поточний стан розширення з background
  let isExtensionEnabled = true;
  try {
    const response = await chrome.runtime.sendMessage({
      type: MessageType.GET_CAPTION_STATUS,
    });
    if (response && typeof response.isExtensionEnabled === "boolean") {
      isExtensionEnabled = response.isExtensionEnabled;
    }
  } catch (error) {
    console.warn("Failed to get extension state:", error);
  }
  if (!captionAdapter || !isCaptionModuleInitialized) {
    // Якщо модуль не готовий, відправляємо базовий стан
    statePayload = {
      isInitialized: false,
      isSupportedPlatform: isCurrentPlatformSupported(),
      isInMeeting: false,
      isRecording: false,
      isPaused: false,
      isExtensionEnabled: isExtensionEnabled,
      isPanelVisible: isPanelVisible,
      currentPlatform: "unknown",
      isError: errorSource ? classifyError(errorSource) : undefined,
    };
  } else {
    try {
      const recordingState = await captionAdapter.getRecordingState();
      statePayload = {
        isInitialized: true,
        isSupportedPlatform: true,
        isInMeeting: await captionAdapter.isInMeeting(),
        isRecording: recordingState.isRecording,
        isPaused: recordingState.isPaused,
        isExtensionEnabled: isExtensionEnabled,
        isPanelVisible: isPanelVisible,
        currentPlatform: getCurrentPlatformInfo()
          .name as CaptionState["currentPlatform"],
        isError: errorSource ? classifyError(errorSource) : undefined,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message.toLowerCase()
          : String(error).toLowerCase();
      let classifiedError: errorType;

      if (errorMessage.includes("captions disabled")) {
        classifiedError = "subtitles_disabled";
      } else if (errorMessage.includes("user not authorized")) {
        classifiedError = "not_authorized";
      } else if (errorMessage.includes("incorrect language")) {
        classifiedError = "incorrect_language";
      } else {
        classifiedError = "unknown_error";
      }

      statePayload = {
        ...lastKnownState,
        isError: classifiedError,
      };
    }
  }

  chrome.runtime.sendMessage({
    type: MessageType.STATE_UPDATED,
    data: statePayload,
  });
}

function classifyError(error: unknown): errorType {
  const errorMessage = (
    error instanceof Error ? error.message : String(error)
  ).toLowerCase();
  let classifiedError: errorType;
  if (errorMessage.includes("captions disabled")) {
    classifiedError = "subtitles_disabled";
  } else if (errorMessage.includes("user not authorized")) {
    classifiedError = "not_authorized";
  } else if (errorMessage.includes("incorrect language")) {
    classifiedError = "incorrect_language";
  } else {
    classifiedError = "unknown_error";
  }

  return classifiedError;
}

// Допоміжна функція для безпечного отримання стану
async function getSafeLastKnownState(): Promise<Partial<CaptionState>> {
  if (!captionAdapter) return { isInitialized: false };

  // Отримуємо поточний стан розширення з background
  let isExtensionEnabled = true;
  try {
    const response = await chrome.runtime.sendMessage({
      type: MessageType.GET_CAPTION_STATUS,
    });
    if (response && typeof response.isExtensionEnabled === "boolean") {
      isExtensionEnabled = response.isExtensionEnabled;
    }
  } catch (error) {
    console.warn(
      "Failed to get extension state in getSafeLastKnownState:",
      error
    );
  }

  try {
    const recordingState = await captionAdapter.getRecordingState();
    return {
      isInitialized: true,
      isSupportedPlatform: true,
      isInMeeting: await captionAdapter.isInMeeting(),
      isRecording: recordingState.isRecording,
      isPaused: recordingState.isPaused,
      isExtensionEnabled: isExtensionEnabled,
      isPanelVisible: isPanelVisible,
      currentPlatform: getCurrentPlatformInfo()
        .name as CaptionState["currentPlatform"],
      isError: undefined,
    };
  } catch {
    return { isInitialized: true, isRecording: false, isPaused: false };
  }
}

// =======================================================
// ЛОГІКА БЕКАПІВ ТА ЗБЕРЕЖЕННЯ
// =======================================================

/**
 * Перевіряє наявність бекапу для поточної зустрічі та відновлює дані.
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
      if (captionAdapter) {
        captionAdapter.hydrate(response.data);
        if (response.data?.captions?.length) {
          showCaptionNotification(
            `Recovered ${
              response.data?.captions?.length || 0
            } captions from previous session`,
            "success"
          );
        }

        // Оновлюємо стан в background після гідрації
        await reportStateToBackground();
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
 * Оновлює видимість панелі на основі стану зустрічі та налаштувань користувача
 */
async function updatePanelVisibility(
  forceShow?: boolean,
  retryCount = 0
): Promise<void> {
  // Якщо forceShow не вказано, обчислюємо автоматично
  const shouldShow =
    forceShow !== undefined ? forceShow : await shouldPanelBeVisible();

  console.log(
    `📱 [PANEL] updatePanelVisibility called with shouldShow: ${shouldShow}, retry: ${retryCount}`
  );

  const tryUpdatePanel = () => {
    const panelContainer = document.getElementById(
      "chrome-extension-float-panel-container"
    );
    if (panelContainer) {
      if (shouldShow) {
        panelContainer.style.display = "block";
        console.log("📱 [PANEL] Panel shown");
      } else {
        panelContainer.style.display = "none";
        console.log("📱 [PANEL] Panel hidden");
      }
    } else if (retryCount < 10) {
      console.log(
        `📱 [PANEL] Panel container not found, retrying in 500ms... (${
          retryCount + 1
        }/10)`
      );

      // Додаткова діагностика - показуємо всі елементи з подібними ID
      if (retryCount === 0) {
        const allElements = document.querySelectorAll('[id*="panel"]');
        console.log(
          `🔍 [PANEL] Found ${allElements.length} elements with 'panel' in ID:`,
          Array.from(allElements).map((el) => el.id)
        );
      }

      setTimeout(() => updatePanelVisibility(forceShow, retryCount + 1), 500);
    } else {
      console.warn(
        "📱 [PANEL] Panel container not found after 10 retries, giving up"
      );

      // Фінальна діагностика
      const allElements = document.querySelectorAll('[id*="chrome-extension"]');
      console.log(
        `🔍 [PANEL] Final check - Found ${allElements.length} chrome-extension elements:`,
        Array.from(allElements).map((el) => el.id)
      );
    }
  };

  tryUpdatePanel();
}

/**
 * Примусово зберігає поточну сесію. Використовується при закритті вкладки.
 */
export async function triggerAutoSave() {
  if (captionAdapter) {
    const state = await captionAdapter.getRecordingState();
    if (state.isRecording || state.isPaused) {
      await backupCurrentSession();

      await addBackupToHistory();
    }
  }
}

/**
 * Створює бекап поточних даних сесії і відправляє в background.
 */
async function backupCurrentSession() {
  if (!captionAdapter || !isCaptionModuleInitialized) {
    return;
  }

  try {
    const captions = captionAdapter.getCaptions();
    const chatMessages = captionAdapter.getChatMessages();
    const meetingInfo = captionAdapter.getMeetingInfo();
    const recordingState = await captionAdapter.getRecordingState();

    // Отримуємо attendeeReport якщо доступний
    let attendeeReport = null;
    try {
      if (captionAdapter && "getAttendeeReport" in captionAdapter) {
        attendeeReport = await (captionAdapter as any).getAttendeeReport();
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

// =======================================================
// ОЧИЩЕННЯ
// =======================================================
export async function cleanupCaptionModule() {
  if (captionAdapter) {
    try {
      // Зупиняємо періодичні бекапи
      stopPeriodicBackups();

      await captionAdapter.cleanup();
      captionAdapter = null;
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
 * Повністю вимикає caption module (використовується при isExtensionEnabled = false)
 */
export async function disableCaptionModule() {
  console.log("🔌 [MODULE] Disabling caption module");

  // Зупиняємо запис якщо активний
  if (captionAdapter) {
    try {
      await captionAdapter.hardStopRecording();
      console.log("🔌 [MODULE] Recording stopped");
    } catch (error) {
      console.warn("Failed to stop recording:", error);
    }
  }

  // Приховуємо панель
  await updatePanelVisibility(false);

  // Очищаємо модуль
  await cleanupCaptionModule();

  // Відправляємо стан в background
  await reportStateToBackground();

  console.log("🔌 [MODULE] Caption module disabled");
}

/**
 * Повторно ініціалізує caption module (використовується при isExtensionEnabled = true)
 */
export async function reinitializeCaptionModule() {
  console.log("🔌 [MODULE] Reinitializing caption module");
  console.log(
    "🔌 [MODULE] Current isCaptionModuleInitialized:",
    isCaptionModuleInitialized
  );

  // Очищаємо попередній стан
  console.log("🔌 [MODULE] Cleaning up previous state...");
  await cleanupCaptionModule();
  console.log("🔌 [MODULE] Cleanup completed");

  // Скидаємо глобальні змінні
  isCaptionModuleInitialized = false;
  isPanelVisible = true; // Встановлюємо панель видимою при реініціалізації

  // Видаляємо маркер ініціалізації щоб дозволити повторну ініціалізацію
  const existingMarker = document.getElementById("caption-module-initialized");
  if (existingMarker) {
    existingMarker.remove();
    console.log(
      "🔌 [MODULE] Removed initialization marker for reinitialization"
    );
  }

  // Ініціалізуємо заново
  console.log("🔌 [MODULE] Starting reinitialization...");
  await initializeCaptionModule();
  console.log("🔌 [MODULE] Reinitialization completed");

  // Встановлюємо видимість панелі після реініціалізації
  setTimeout(async () => {
    await updatePanelVisibility();
    console.log("🔌 [MODULE] Panel visibility updated after reinitialization");
  }, 200);

  // Відправляємо оновлений стан в background
  await reportStateToBackground();

  console.log("🔌 [MODULE] Caption module reinitialized");
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

let lastSaveTime = 0;
const SAVE_DEBOUNCE_MS = 1000; // 1 секунда
/**
 * Зберігає дані субтитрів в background
 */
async function saveCaptionDataToBackground(data: any) {
  // Уникаємо дублікатів збереження
  const now = Date.now();
  if (now - lastSaveTime < SAVE_DEBOUNCE_MS) {
    console.log("⏭️ [SAVE] Skipping duplicate save request");
    return;
  }
  lastSaveTime = now;

  try {
    if (!captionAdapter) {
      console.error("❌ [SAVE] Caption adapter not available");
      return;
    }

    const captions = captionAdapter.getCaptions();
    const chatMessages = captionAdapter.getChatMessages();
    const meetingInfo = captionAdapter.getMeetingInfo();
    const recordingState = await captionAdapter.getRecordingState();

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
