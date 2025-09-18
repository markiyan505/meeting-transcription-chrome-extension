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
import type { MeetingInfo, SessionData, SessionState } from "@/types/session";
import { CaptionAdapter } from "./caption/types";
import { showCaptionNotification } from "./uiNotifier";

import type { ErrorType } from "@/types/session";
import type {
  ReportRecordingStartedCommand,
  ReportRecordingResumedCommand,
  ReportCommandFailedCommand,
  SaveSessionDataCommand,
  UpsertSessionDataCommand,
} from "@/types/messages";

export function initializeCaptionModuleOnload(): void {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("[CONTENT SCRIPT OUTSIDE] Received message:", message.type);

    if (!chrome.runtime?.id) {
      console.error(
        "[CONTENT SCRIPT] Extension context invalidated, cannot handle message"
      );
      sendResponse({ success: false, error: "Extension context invalidated" });
      return false;
    }

    handleChromeMessages(message, sender, sendResponse);
    return true;
  });

  console.log("[Content] Script is ready, reporting to background.");
  chrome.runtime.sendMessage({ type: "EVENT.CONTENT.INITIALIZE" });
}

let captionAdapter: CaptionAdapter | null = null;
let isCaptionModuleInitialized = false;
// let isExtensionCurrentlyEnabled = false;

const BATCH_INTERVAL_MS = 2000;

import type { CaptionEntry, ChatMessage, AttendeeEvent } from "@/types/session";

let streamingInterval: ReturnType<typeof setInterval> | null = null;

let dataBuffer: UpsertSessionDataCommand["payload"] = {
  captions: [],
  chatMessages: [],
  attendeeEvents: [],
  meetingInfo: {},
};

function isBufferEmpty(buffer: typeof dataBuffer): boolean {
  if (!buffer) return true;
  return (
    (buffer.captions?.length ?? 0) === 0 &&
    (buffer.chatMessages?.length ?? 0) === 0 &&
    (buffer.attendeeEvents?.length ?? 0) === 0 &&
    Object.keys(buffer.meetingInfo ?? {}).length === 0
  );
}

function addToBuffer(payload: UpsertSessionDataCommand["payload"]) {
  if (!payload || !dataBuffer) return;
  if (isBufferEmpty(payload)) return;

  if (payload.captions) {
    const captionsMap = new Map(dataBuffer.captions?.map((c) => [c.id, c]));
    payload.captions.forEach((caption) => captionsMap.set(caption.id, caption));
    dataBuffer.captions = Array.from(captionsMap.values());
  }

  if (payload.chatMessages) {
    dataBuffer.chatMessages = [
      ...(dataBuffer.chatMessages ?? []),
      ...payload.chatMessages,
    ];
  }
  if (payload.attendeeEvents) {
    dataBuffer.attendeeEvents = [
      ...(dataBuffer.attendeeEvents ?? []),
      ...payload.attendeeEvents,
    ];
  }

  if (payload.meetingInfo) {
    dataBuffer.meetingInfo = {
      ...dataBuffer.meetingInfo,
      ...payload.meetingInfo,
    };
  }
}

async function flushBuffer() {
  console.log("[CONTENT SCRIPT] Flushing buffer, dataBuffer:", dataBuffer);
  if (isBufferEmpty(dataBuffer)) {
    return;
  }

  const batchToSend = { ...dataBuffer };
  dataBuffer = {
    captions: [],
    chatMessages: [],
    attendeeEvents: [],
    meetingInfo: {},
  };

  const message: UpsertSessionDataCommand = {
    type: "COMMAND.SESSION.UPSERT_DATA",
    payload: batchToSend,
  };

  try {
    await chrome.runtime.sendMessage(message);
  } catch (error) {
    console.warn("[Content] Failed to send data batch, will retry.", error);
    addToBuffer(batchToSend);
  }
}

function startStreaming() {
  console.log("[CONTENT SCRIPT] Starting streaming");
  if (streamingInterval) return;
  streamingInterval = setInterval(() => {
    console.log("[CONTENT SCRIPT] Flushing buffer");
    flushBuffer();
  }, BATCH_INTERVAL_MS);
}

function stopStreaming() {
  console.log("[CONTENT SCRIPT] Stopping streaming");
  if (streamingInterval) {
    clearInterval(streamingInterval);
    streamingInterval = null;
  }
  flushBuffer();
}

/**
 * Fully disables the caption module (used when isExtensionEnabled = false)
 */

export async function cleanupCaptionModule() {
  if (captionAdapter) {
    await captionAdapter.cleanup();
    captionAdapter = null;
  }
  isCaptionModuleInitialized = false;
  logCaptionEvent("cleanup_completed", {});
}

// async function disableCaptionModule(): Promise<void> {
//   await cleanupCaptionModule();
//   updatePanelVisibility(false);
// }

/**
 * Reinitializes the caption module after it has been disabled
 */
// export async function reinitializeCaptionModule() {
//   console.log("[CONTENT SCRIPT] reinitializeCaptionModule called");
//   await cleanupCaptionModule();
//   await initializeCaptionModule();
// }

/**
 * Updates the visibility of the panel, used for meeting start/end.
 */
function updatePanelVisibility(shouldBeVisible: boolean) {
  const panelContainer = document.getElementById(
    "chrome-extension-float-panel-container"
  );
  if (panelContainer) {
    panelContainer.style.display = shouldBeVisible ? "block" : "none";
  }
}

export async function initializeCaptionModule() {
  console.log("[CONTENT SCRIPT] initializeCaptionModule:");

  // if (isCaptionModuleInitialized && captionAdapter) {
  //   console.log(
  //     "[CONTENT SCRIPT] Caption module already initialized, skipping"
  //   );
  //   return;
  // }

  try {
    if (!chrome.runtime?.id) {
      console.error("[CONTENT SCRIPT] Extension context invalidated");
      return;
    }
    const isSupported = isCurrentPlatformSupported();
    const platformInfo = getCurrentPlatformInfo();
    chrome.runtime.sendMessage({
      type: "EVENT.CONTENT.PLATFORM_INFO",
      payload: { isSupported, platform: platformInfo.name },
    });

    if (!isSupported) {
      console.warn("Platform not supported.");
      return;
    }

    if (platformInfo.name === "Local Development") {
      console.log(
        "[CONTENT SCRIPT] Localhost detected - skipping caption adapter initialization"
      );
      isCaptionModuleInitialized = true;
      showCaptionNotification(
        "Local development mode - authentication only",
        "info"
      );
      return;
    }

    captionAdapter = await createCaptionAdapterForCurrentPlatform({
      autoEnableCaptions: true,
      autoSaveOnEnd: true,
      trackAttendees: true,
      operationMode: "automatic",
    });

    isCaptionModuleInitialized = true;

    const inMeeting = await captionAdapter.isInMeeting();
    console.log("[CONTENT SCRIPT] inMeeting:", inMeeting);
    if (inMeeting) {
      chrome.runtime.sendMessage({
        type: "EVENT.CONTENT.MEETING_STATUS_CHANGED",
        payload: { isInMeeting: true },
      });
    }

    setupCaptionEventHandlers();

    showCaptionNotification("Caption module initialized", "success");
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    handleCaptionError(err, "initializeCaptionModule");
    showCaptionNotification(`Failed to initialize: ${err.message}`, "error");
  }
}

export async function initializeCaptionModuleInPausedState() {
  console.log(
    "[CONTENT SCRIPT] initializeCaptionModuleInPausedState with recovered data"
  );

  // if (isCaptionModuleInitialized && captionAdapter) {
  //   console.log(
  //     "[CONTENT SCRIPT] Caption module already initialized, skipping recovery"
  //   );
  //   return;
  // }

  try {
    const isSupported = isCurrentPlatformSupported();
    const platformInfo = getCurrentPlatformInfo();
    chrome.runtime.sendMessage({
      type: "EVENT.CONTENT.PLATFORM_INFO",
      payload: { isSupported, platform: platformInfo.name },
    });

    if (!isSupported) {
      console.warn("Platform not supported.");
      return;
    }

    // For localhost, we don't need a caption adapter - just handle auth
    if (platformInfo.name === "Local Development") {
      console.log(
        "[CONTENT SCRIPT] Localhost detected - skipping caption adapter recovery"
      );
      isCaptionModuleInitialized = true;
      showCaptionNotification(
        "Local development mode - authentication only",
        "info"
      );
      return;
    }

    captionAdapter = await createCaptionAdapterForCurrentPlatform({
      autoEnableCaptions: true,
      autoSaveOnEnd: true,
      trackAttendees: true,
      operationMode: "automatic",
    });

    console.log("[CONTENT SCRIPT] captionAdapter:", captionAdapter);

    isCaptionModuleInitialized = true;

    (captionAdapter as any).isPaused = true;
    (captionAdapter as any).isRecording = false;

    setupCaptionEventHandlers();

    showCaptionNotification(
      "Recording recovered from previous session. It is now paused.",
      "info"
    );
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    handleCaptionError(err, "initializeCaptionModuleInPausedState");
    showCaptionNotification(`Failed to recover: ${err.message}`, "error");
  }
}

async function handleStartRecording() {
  if (!captionAdapter) return;

  try {
    await captionAdapter.startRecording();

    const report: ReportRecordingStartedCommand = {
      type: "COMMAND.REPORT.RECORDING.STARTED",
      payload: undefined,
    };
    chrome.runtime.sendMessage(report);
  } catch (error) {
    // TODO різні ерорки тре
    console.error("Failed to start recording:", error);
    const report: ReportCommandFailedCommand = {
      type: "COMMAND.REPORT.COMMAND.FAILED",
      payload: {
        failedCommandType: "COMMAND.RECORDING.START",
        errorType: "unknown_error",
      },
    };
    chrome.runtime.sendMessage(report);
  }
}

async function handleResumeRecording() {
  if (!captionAdapter) return;

  try {
    await captionAdapter.resumeRecording();

    const report: ReportRecordingResumedCommand = {
      type: "COMMAND.REPORT.RECORDING.RESUMED",
      payload: undefined,
    };
    chrome.runtime.sendMessage(report);
  } catch (error) {
    console.error("Failed to resume recording:", error);

    const report: ReportCommandFailedCommand = {
      type: "COMMAND.REPORT.COMMAND.FAILED",
      payload: {
        failedCommandType: "COMMAND.RECORDING.RESUME",
        errorType: "unknown_error",
      },
    };
    chrome.runtime.sendMessage(report);
  }
}

let currentTabState: SessionState | null = null;
let currentTabData: SessionData | null = null;

function applyState(newState: SessionState): void {
  console.log("[CONTENT SCRIPT] Applying state:", {
    state: newState.state,
    isExtensionEnabled: newState.isExtensionEnabled,
    isInMeeting: newState.isInMeeting,
    isPanelVisible: newState.isPanelVisible,
    shouldPanelBeVisible: newState.isInMeeting && newState.isPanelVisible,
  });

  currentTabState = newState;
  const shouldPanelBeVisible = newState.isInMeeting && newState.isPanelVisible;
  updatePanelVisibility(shouldPanelBeVisible);
}

/**
 * Handles commands from the background script.
 */
export async function handleChromeMessages(
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: any) => void
) {
  console.log("[CONTENT SCRIPT] handleChromeMessages", message.type);

  if (sender.id !== chrome.runtime.id) {
    sendResponse({ success: false, message: "Sender ID mismatch" });
    console.log("[CONTENT SCRIPT] Sender ID mismatch");
    return;
  }

  let result: any = { success: true };
  try {
    console.log("[CONTENT SCRIPT] Received message:", message.type);
    switch (message.type) {
      case "COMMAND.CONTENT.ENABLE":
        // if (message.payload.isEnabled) {
        await initializeCaptionModule();
        result = { success: true, message: "Caption module initialized" };
        // } else {
        //   disableCaptionModule();
        // }
        break;

      // case "COMMAND.CONTENT.RECOVER_FROM_BACKUP":
      //   await initializeCaptionModuleInPausedState();
      //   break;

      case "COMMAND.PANEL.TOGGLE_ENABLED":
        console.log("[CONTENT SCRIPT] Toggling panel visibility");
        updatePanelVisibility(true);
        result = { success: true, message: "Panel enabled" };
        break;

      case "COMMAND.PANEL.TOGGLE_DISABLED":
        console.log("[CONTENT SCRIPT] Toggling panel visibility");
        updatePanelVisibility(false);
        result = { success: true, message: "Panel disabled" };
        break;

      // case "EVENT.CONTEXT_STATE_CHANGED":
      //   console.log(
      //     "[CONTENT SCRIPT] Received state change:",
      //     message.payload.newState
      //   );
      //   applyState(message.payload.newState);
      //   break;
      default:
        result = { success: false, error: "Unknown command" };
    }

    if (captionAdapter) {
      switch (message.type) {
        case "COMMAND.RECORDING.START":
          handleStartRecording();
          break;
        case "COMMAND.RECORDING.STOP":
          result = await captionAdapter.stopRecording();
          break;
        case "COMMAND.RECORDING.PAUSE":
          result = await captionAdapter.pauseRecording();
          break;
        case "COMMAND.RECORDING.RESUME":
          handleResumeRecording();
          break;
        case "COMMAND.RECORDING.DELETE":
          result = await captionAdapter.hardStopRecording();
          break;
      }
    }
    // case "COMMAND.CAPTIONS.ENABLE":
    //   result = await captionAdapter.enableCaptions();
    //   break;
    // case "COMMAND.CAPTIONS.DISABLE":
    //   result = await captionAdapter.disableCaptions();
    //   break;
  } catch (error) {
    console.error("[CONTENT SCRIPT] Error handling message:", error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  // Always send a response for successful cases
  if (result !== undefined) {
    sendResponse(result);
  } else {
    sendResponse({
      success: false,
      error: "Unknown command",
    });
  }
}

/**
 * Налаштовує обробники подій від адаптера для звітування у background.
 */
function setupCaptionEventHandlers() {
  if (!captionAdapter) return;

  captionAdapter.on("meeting_started", () => {
    console.log(
      "[CONTENT SCRIPT] Meeting started calling EVENT.CONTENT.MEETING_STATUS_CHANGED"
    );
    chrome.runtime.sendMessage({
      type: "EVENT.CONTENT.MEETING_STATUS_CHANGED",
      payload: { isInMeeting: true },
    });

    logCaptionEvent("meeting_started", {});
    showCaptionNotification("Meeting started", "info");
    updatePanelVisibility(true);
  });

  captionAdapter.on("meeting_ended", () => {
    console.log(
      "[CONTENT SCRIPT] Meeting ended calling EVENT.CONTENT.MEETING_STATUS_CHANGED"
    );
    chrome.runtime.sendMessage({
      type: "EVENT.CONTENT.MEETING_STATUS_CHANGED",
      payload: { isInMeeting: false },
    });

    logCaptionEvent("meeting_ended", {});
    showCaptionNotification("Meeting ended", "info");
    updatePanelVisibility(false);
  });

  // captionAdapter.on("hydrated", (data: any) => {
  //   logCaptionEvent("hydrated", data);
  //   showCaptionNotification("State recovered from previous session", "success");
  // });

  // captionAdapter.on("data_cleared", (data: any) => {
  //   logCaptionEvent("data_cleared", data);
  // });

  captionAdapter.on("error", (data: any) => {
    logCaptionEvent("error", data);
    // TODO додати якусь обробку може
    const errorType: ErrorType = "unknown_error";
    // reportState({ isError: errorType });
    showCaptionNotification(
      `An error occurred: ${data.error.message}`,
      "error"
    );
  });

  captionAdapter.on("caption_added", (caption: CaptionEntry) => {
    console.log("[CONTENT SCRIPT] caption_added", caption);
    addToBuffer({ captions: [caption] });
  });
  captionAdapter.on("caption_updated", (caption: CaptionEntry) => {
    console.log("[CONTENT SCRIPT] caption_updated", caption);
    addToBuffer({ captions: [caption] });
  });
  captionAdapter.on("chat_message_added", (msg: ChatMessage) => {
    console.log("[CONTENT SCRIPT] chat_message_added", msg);
    addToBuffer({ chatMessages: [msg] });
  });
  captionAdapter.on("attendees_updated", (events: AttendeeEvent[]) => {
    console.log("[CONTENT SCRIPT] attendees_updated", events);
    addToBuffer({ attendeeEvents: events });
  });
  captionAdapter.on("title_changed", (newTitle: string) => {
    console.log("[CONTENT SCRIPT] title_changed", newTitle);
    addToBuffer({ meetingInfo: { title: newTitle } });
  });

  captionAdapter.on("meeting_info_changed", (newMeetingInfo: MeetingInfo) => {
    console.log("[CONTENT SCRIPT] meeting_info_changed", newMeetingInfo);
    addToBuffer({ meetingInfo: newMeetingInfo });
  });

  // captionAdapter.on("captions_enabled", (data: any) => {
  //   logCaptionEvent("captions_enabled", data);
  //   showCaptionNotification("Captions enabled", "success");
  // });

  // captionAdapter.on("captions_disabled", (data: any) => {
  //   logCaptionEvent("captions_disabled", data);
  //   showCaptionNotification("Captions disabled", "warning");
  // });

  captionAdapter.on("recording_started", (data: any) => {
    logCaptionEvent("recording_started", data);
    showCaptionNotification("Recording started", "info");

    startStreaming();
  });

  captionAdapter.on("recording_hard_stopped", (data: any) => {
    logCaptionEvent("recording_hard_stopped", data);
    showCaptionNotification("Recording deleted", "warning");

    stopStreaming();

    chrome.runtime.sendMessage({
      type: "clear_caption_backup",
    });
  });

  captionAdapter.on("recording_stopped", (data: any) => {
    logCaptionEvent("recording_stopped", data);
    showCaptionNotification("Recording stopped", "info");

    stopStreaming();

    // saveCaptionDataToBackground(data);
  });

  captionAdapter.on("recording_paused", (data: any) => {
    logCaptionEvent("recording_paused", data);
    showCaptionNotification("Recording paused", "warning");

    stopStreaming();
  });

  captionAdapter.on("recording_resumed", (data: any) => {
    logCaptionEvent("recording_resumed", data);
    showCaptionNotification("Recording resumed", "info");

    startStreaming();
  });

  // function saveCaptionDataToBackground(data: any) {
  //   logCaptionEvent("recording_stopped", {});
  //   if (!captionAdapter) return;
  //   // TODO додати якусь обробку може ше
  //   const sessionData = {
  //     id: "",
  //     timestamp: new Date().toISOString(),
  //     url: window.location.href,
  //     title: document.title,
  //     captions: captionAdapter.getCaptions(),
  //     chatMessages: captionAdapter.getChatMessages(),
  //     meetingInfo: captionAdapter.getMeetingInfo(),
  //     // attendeeReport: captionAdapter.getAttendeeReport(),
  //   };

  //   const message: SaveSessionDataCommand = {
  //     type: "COMMAND.SESSION.SAVE",
  //     payload: {
  //       tabId: -1,
  //       data: sessionData as any,
  //     },
  //   };
  //   chrome.runtime.sendMessage(message);
  //   showCaptionNotification("Recording saved.", "success");
  // }
}
