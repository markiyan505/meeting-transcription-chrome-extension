import { BackgroundStateService } from "./BackgroundStateService";

import { callMessageHandler } from "./messageHandlers";
import type { MessageHandlerMap } from "./messageHandlers";

import { SessionManager } from "./modules/SessionManager";
// import { SettingsManager } from "./modules/SettingsManager";
// import { ExportManager } from "./modules/ExportManager";
import { AuthManager } from "./modules/AuthManager";
import { DatabaseManager } from "./modules/DatabaseManager";
import { requiresAuth, requiresActiveExtension } from "./messageHandlers";

import type { ChromeMessage } from "@/types/messages";

const BACKUP_ALARM_NAME = "PERIODIC_BACKUP_ALARM";
const BACKUP_INTERVAL_MIN = 0.25;

export const REFRESH_TOKEN_ALARM_NAME = "REFRESH_TOKEN_ALARM";

console.log("[BACKGROUND] Background script loaded");
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("[BACKGROUND] Extension installed:", details);
  // await SettingsManager.initializeSettings(details.reason);
  chrome.alarms.create(BACKUP_ALARM_NAME, {
    periodInMinutes: BACKUP_INTERVAL_MIN,
  });
});

export const stateService = new BackgroundStateService(
  SessionManager.saveSession
);

const messageHandlers: MessageHandlerMap = {
  "EVENT.CONTENT.INITIALIZE": (msg, tabId) =>
    stateService.handleContentScriptReady(tabId),

  "EVENT.CONTENT.MEETING_STATUS_CHANGED": async (msg, tabId) =>
    await stateService.handleMeetingStatusChanged(tabId, msg!.payload!),

  "EVENT.CONTENT.PLATFORM_INFO": (msg, tabId) =>
    stateService.handlePlatformInfo(tabId, msg!.payload!),

  "COMMAND.RECORDING.START": requiresActiveExtension(
    requiresAuth((msg, tabId) => {
      console.log("[BACKGROUND] Starting recording for tab:", tabId);
      stateService.startRecording(tabId);
    })
  ),
  "COMMAND.RECORDING.STOP": requiresActiveExtension(
    requiresAuth((msg, tabId) => {
      console.log("[BACKGROUND] Stopping recording for tab:", tabId);
      stateService.stopRecording(tabId);
    })
  ),
  "COMMAND.RECORDING.PAUSE": requiresActiveExtension(
    requiresAuth((msg, tabId) => {
      console.log("[BACKGROUND] Pausing recording for tab:", tabId);
      stateService.pauseRecording(tabId);
    })
  ),
  "COMMAND.RECORDING.RESUME": requiresActiveExtension(
    requiresAuth((msg, tabId) => {
      console.log("[BACKGROUND] Resuming recording for tab:", tabId);
      stateService.resumeRecording(tabId);
    })
  ),
  "COMMAND.RECORDING.DELETE": requiresActiveExtension(
    requiresAuth((msg, tabId) => {
      console.log("[BACKGROUND] Deleting recording for tab:", tabId);
      stateService.deleteRecording(tabId);
    })
  ),

  "COMMAND.PANEL.TOGGLE_VISIBILITY": (msg, tabId) => {
    console.log("[BACKGROUND] Toggling panel visibility for tab:", tabId);
    stateService.togglePanelVisibility(tabId);
  },

  "COMMAND.SESSION.UPSERT_DATA": (msg, tabId) =>
    stateService.upsertData(tabId, msg.payload),

  "COMMAND.REPORT.RECORDING.STARTED": (msg, tabId) =>
    stateService.handleRecordingStarted(tabId),

  "COMMAND.REPORT.RECORDING.RESUMED": (msg, tabId) =>
    stateService.handleRecordingResumed(tabId),

  "COMMAND.REPORT.COMMAND.FAILED": (msg, tabId) =>
    stateService.handleCommandFailed(tabId, msg.payload!),

  "QUERY.APP.GET_STATE": async (msg, tabId, sendResponse) => {
    console.log("[BACKGROUND] Getting app state for tab:", tabId);
    const state = await stateService.getAppState(tabId);
    stateService.broadcastStateToUI(state.state, tabId);
    sendResponse(state);
  },

  "QUERY.APP.GET_HISTORY": requiresAuth(async (msg, tabId, sendResponse) => {
    const history = await SessionManager.getSessionHistory();
    sendResponse(history);
  }),

  "COMMAND.SESSION.CLEAR_HISTORY": requiresAuth((msg, tabId) =>
    SessionManager.clearSessionHistory()
  ),

  "QUERY.SESSION.CHECK_BACKUP": async (msg, tabId, sendResponse) => {
    const backup = await SessionManager.getAndPrepareBackupForUrl(
      msg.payload.url
    );
    sendResponse(backup);
  },

  // "COMMAND.EXTENSION.TOGGLE_ENABLED": async (msg, tabId) => {
  //   const isEnabled = await SettingsManager.toggleExtensionState();
  //   stateService.updateTabSessionState(
  //     tabId,
  //     { isExtensionEnabled: isEnabled },
  //     true
  //   );
  // },

  // "COMMAND.SETTINGS.UPDATE": async (msg, tabId) => {
  //   const settingsMsg = msg as Extract<
  //     ChromeMessage,
  //     { type: "COMMAND.SETTINGS.UPDATE" }
  //   >;
  //   if (settingsMsg.payload) {
  //     await SettingsManager.updateSettings(settingsMsg.payload.settings);
  //   }
  //   // TODO: Повідомити всіх про оновлення налаштувань
  // },

  // "COMMAND.SESSION.EXPORT": requiresAuth(async (msg, tabId, sendResponse) => {
  //   const exportMsg = msg as Extract<
  //     ChromeMessage,
  //     { type: "COMMAND.SESSION.EXPORT" }
  //   >;
  //   if (exportMsg.payload) {
  //     const result = await ExportManager.exportSessionData(
  //       exportMsg.payload.sessionId,
  //       exportMsg.payload.format
  //     );
  //     sendResponse({ success: true, filename: result });
  //   } else {
  //     sendResponse({ success: false, error: "Missing payload" });
  //   }
  // }),

  "QUERY.AUTH.GET_STATUS": async (msg, tabId, sendResponse) => {
    const [session, isAuthenticated, tokenExpiry, user] = await Promise.all([
      AuthManager.getSession(),
      AuthManager.isAuthenticated(),
      AuthManager.getTokenExpiry(),
      AuthManager.getUser(),
    ]);
    sendResponse({
      success: true,
      isAuthenticated,
      session,
      tokenExpiry: tokenExpiry?.toISOString(),
      user,
    });
  },

  "COMMAND.AUTH.UPDATE_SESSION": (msg, tabId) => {
    const authMsg = msg as Extract<
      ChromeMessage,
      { type: "COMMAND.AUTH.UPDATE_SESSION" }
    >;
    if (authMsg.payload && authMsg.payload.session) {
      return AuthManager.saveSession(authMsg.payload.session);
    }
  },

  "COMMAND.AUTH.REFRESH_TOKEN": (msg, tabId) => AuthManager.refreshToken(),

  "COMMAND.AUTH.CLEAR_SESSION": async (msg, tabId) => {
    console.log("[BACKGROUND] Clearing session for tab:", tabId);
    try {
      await AuthManager.clearSession();
      await DatabaseManager.clearProfileCache();
      console.log(
        "[BACKGROUND] Session and profile cache cleared successfully"
      );
    } catch (error) {
      console.error("[BACKGROUND] Session clear failed:", error);
    }
  },

  // User Profile handlers
  "QUERY.USER.GET_PROFILE": async (msg, tabId, sendResponse) => {
    console.log("[BACKGROUND] Getting user profile for tab:", tabId);
    try {
      const profile = await DatabaseManager.getUserProfile();
      const response = {
        success: true,
        profile,
      };
      console.log("[BACKGROUND] User profile response:", {
        hasProfile: !!profile,
        email: profile?.email,
        name: profile ? `${profile.first_name} ${profile.last_name}` : null,
      });
      sendResponse(response);
    } catch (error) {
      console.error("[BACKGROUND] Error getting user profile:", error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },

  "QUERY.USER.GET_CACHED_PROFILE": async (msg, tabId, sendResponse) => {
    console.log("[BACKGROUND] Getting cached user profile for tab:", tabId);
    try {
      const profile = await DatabaseManager.getCachedProfile();
      const response = {
        success: true,
        profile,
      };
      console.log("[BACKGROUND] Cached user profile response:", {
        hasProfile: !!profile,
        email: profile?.email,
      });
      sendResponse(response);
    } catch (error) {
      console.error("[BACKGROUND] Error getting cached user profile:", error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },

  "COMMAND.USER.REFRESH_PROFILE": async (msg, tabId) => {
    console.log("[BACKGROUND] Refreshing user profile for tab:", tabId);
    try {
      const profile = await DatabaseManager.refreshProfile();
      console.log("[BACKGROUND] User profile refresh completed:", {
        hasProfile: !!profile,
        email: profile?.email,
      });
    } catch (error) {
      console.error("[BACKGROUND] User profile refresh failed:", error);
    }
  },

  "QUERY.USER.GET_CACHE_INFO": async (msg, tabId, sendResponse) => {
    console.log("[BACKGROUND] Getting cache info for tab:", tabId);
    try {
      const cacheInfo = await DatabaseManager.getCacheInfo();
      const response = {
        success: true,
        cacheInfo,
      };
      console.log("[BACKGROUND] Cache info response:", cacheInfo);
      sendResponse(response);
    } catch (error) {
      console.error("[BACKGROUND] Error getting cache info:", error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },

  "COMMAND.USER.CLEAR_CACHE": async (msg, tabId) => {
    console.log("[BACKGROUND] Force clearing cache for tab:", tabId);
    try {
      await DatabaseManager.clearProfileCache();
      console.log("[BACKGROUND] Cache cleared successfully");
    } catch (error) {
      console.error("[BACKGROUND] Cache clear failed:", error);
    }
  },
};

chrome.runtime.onMessage.addListener(
  (message: ChromeMessage, sender, sendResponse) => {
    const isAsyncQuery = message.type.startsWith("QUERY.");

    (async () => {
      const tabId =
        sender.tab?.id ??
        (await chrome.tabs.query({ active: true, currentWindow: true }))[0]?.id;

      if (!tabId) {
        console.warn("[BACKGROUND] No tab ID found for message:", message.type);
        return;
      }

      console.log(
        "[BACKGROUND] Received message:",
        message.type,
        "from tab:",
        tabId
      );

      try {
        await callMessageHandler(message, messageHandlers, tabId, sendResponse);

        if (!isAsyncQuery) {
          // sendResponse(true);
        }
      } catch (error) {
        console.error(`[BACKGROUND] Error handling "${message.type}":`, error);

        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    })();

    return isAsyncQuery;
  }
);

chrome.tabs.onRemoved.addListener((tabId) => {
  stateService.handleTabRemoval(tabId);
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === BACKUP_ALARM_NAME) {
    stateService.backupActiveSessions();
  }

  if (alarm.name === REFRESH_TOKEN_ALARM_NAME) {
    console.log("[BACKGROUND] Token refresh alarm triggered");
    AuthManager.refreshToken();
  }
});


