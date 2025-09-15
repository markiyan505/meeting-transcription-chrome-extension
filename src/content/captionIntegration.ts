/**
 * Caption integration module for content script.
 * Executes commands from background and reports state changes.
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

let captionAdapter: any;
let isCaptionModuleInitialized = false;
let isPanelVisible = true;
let backupInterval: ReturnType<typeof setInterval> | null = null;
const BACKUP_INTERVAL_MS = 30000;

/**
 * Syncs isPanelVisible with captionStore
 */
async function syncPanelVisibilityFromStore() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: MessageType.GET_CAPTION_STATUS,
    });
    if (response && typeof response.isPanelVisible === "boolean") {
      isPanelVisible = response.isPanelVisible;
    }
  } catch (error) {
    console.warn("Failed to sync isPanelVisible from store:", error);
  }
}

/**
 * The panel is visible only if: isPanelVisible = true AND isInMeeting = true
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
 * Initializes the caption module on the page.
 */
export async function initializeCaptionModule() {
  try {
    try {
      const response = await chrome.runtime.sendMessage({
        type: MessageType.GET_CAPTION_STATUS,
      });
      if (response && response.isExtensionEnabled === false) {
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

    await syncPanelVisibilityFromStore();

    setTimeout(async () => {
      await updatePanelVisibility();
    }, 200);

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
    await reportStateToBackground(error);
  }
}

/**
 * Handles commands from the background script.
 */
export async function handleCaptionMessages(
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: any) => void
) {
  if (sender.id !== chrome.runtime.id) {
    sendResponse({ success: false, message: "Sender ID mismatch" });
    return;
  }

  try {
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
          break;

        case MessageType.TOGGLE_PANEL_VISIBILITY:
          isPanelVisible = !isPanelVisible;
   
          await updatePanelVisibility();
          result = {
            success: true,
            message: `Panel ${isPanelVisible ? "enabled" : "disabled"}`,
          };
     
          break;

        case "GET_PLATFORM_INFO":
          try {
            const platformInfo = getCurrentPlatformInfo();
            const isSupported = isCurrentPlatformSupported();
        
            result = {
              success: true,
              isSupportedPlatform: isSupported,
              currentPlatform: platformInfo.name,
            };
          } catch (error) {
            result = {
              success: true,
              isSupportedPlatform: false,
              currentPlatform: "unknown",
              error: error instanceof Error ? error.message : String(error),
            };
          }
          break;
        default:
          result = {
            success: false,
            error: `Unknown message type: ${message.type}`,
          };
          break;
      }
      if (result.warning) {
        showCaptionNotification(result.warning, "warning");
      }

      if (message.type !== "GET_PLATFORM_INFO") {
        await reportStateToBackground();
      }

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

    saveCaptionDataToBackground(data);
  });

  captionAdapter.on("recording_paused", (data: any) => {

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

/**
 * Collects the current state and sends it to the background.
 */
async function reportStateToBackground(errorSource?: unknown) {
  let statePayload: Partial<CaptionState>;
  const lastKnownState = await getSafeLastKnownState();

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

async function getSafeLastKnownState(): Promise<Partial<CaptionState>> {
  if (!captionAdapter) return { isInitialized: false };

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

/**
 * Checks for a backup for the current meeting and restores the data.
 */
export async function checkAndRecoverBackup() {
  try {

    const response = await chrome.runtime.sendMessage({
      type: "check_backup_recovery",
      currentUrl: window.location.href,
    });


    if (response?.success && response.shouldRecover) {

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

        await reportStateToBackground();
      }
    }
  } catch (error) {
    console.error("❌ [RECOVERY] Failed to check backup recovery:", error);
  }
}

/**
 * Updates the visibility of the panel based on the meeting state and user settings
 */
async function updatePanelVisibility(
  forceShow?: boolean,
  retryCount = 0
): Promise<void> {
  const shouldShow =
    forceShow !== undefined ? forceShow : await shouldPanelBeVisible();


  const tryUpdatePanel = () => {
    const panelContainer = document.getElementById(
      "chrome-extension-float-panel-container"
    );
    if (panelContainer) {
      if (shouldShow) {
        panelContainer.style.display = "block";
      } else {
        panelContainer.style.display = "none";
      }
    } else if (retryCount < 10) {

      if (retryCount === 0) {
        const allElements = document.querySelectorAll('[id*="panel"]');

      }

      setTimeout(() => updatePanelVisibility(forceShow, retryCount + 1), 500);
    } else {


      const allElements = document.querySelectorAll('[id*="chrome-extension"]');

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


}

export async function cleanupCaptionModule() {
  if (captionAdapter) {
    try {
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
 * Fully disables the caption module (used when isExtensionEnabled = false)
 */
export async function disableCaptionModule() {
  if (captionAdapter) {
    try {
      await captionAdapter.hardStopRecording();
    } catch (error) {
    }
  }

  await updatePanelVisibility(false);

  await cleanupCaptionModule();

  await reportStateToBackground();
}

/**
 * Повторно ініціалізує caption module (використовується при isExtensionEnabled = true)
 */
export async function reinitializeCaptionModule() {

  await cleanupCaptionModule();

  isCaptionModuleInitialized = false;
  isPanelVisible = true;

  const existingMarker = document.getElementById("caption-module-initialized");
  if (existingMarker) {
    existingMarker.remove();
  }

  await initializeCaptionModule();

  setTimeout(async () => {
    await updatePanelVisibility();
  }, 200);

  await reportStateToBackground();

}

/**
 * Stops periodic backups
 */
function stopPeriodicBackups() {
  if (backupInterval) {
    clearInterval(backupInterval);
    backupInterval = null;

  }
}

let lastSaveTime = 0;
const SAVE_DEBOUNCE_MS = 1000;
/**
 * Saves the caption data to the background
 */
async function saveCaptionDataToBackground(data: any) {
  const now = Date.now();
  if (now - lastSaveTime < SAVE_DEBOUNCE_MS) {
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

    } else if (response?.skipped) {

      showCaptionNotification(
        response.message || "No data to save. Recording was empty.",
        "warning"
      );
    } else {
      console.error("❌ [SAVE] Failed to save caption data:", response?.error);

      showCaptionNotification(
        `Failed to save recording: ${response?.error || "Unknown error"}`,
        "error"
      );
    }
  } catch (error) {
    console.error("❌ [SAVE] Failed to save caption data:", error);

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

      } else {

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
