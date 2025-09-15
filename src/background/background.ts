/**
 * Background service worker for Chrome extension
 * Головний файл - координація всіх модулів
 */
import { BadgeManager } from "./modules/BadgeManager";
import { SettingsManager } from "./modules/SettingsManager";
import { SessionManager } from "./modules/SessionManager";
import { MessageType, MessageUtils } from "../types/messages";
import { StateManager } from "./modules/StateManager";
import { CaptionState } from "@/store/captionStore";
import { ExportManager } from "./modules/ExportManager";
import { AuthManager } from "./modules/AuthManager";

console.log("Background script loaded");

// Handle extension installation/update
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("Extension installed:", details);
  await SettingsManager.initializeSettings(details.reason);
});

// Handle tab updates
// chrome.tabs.onUpdated.addListener((targetTabId, changeInfo, tab) => {
//   if (changeInfo.status === "complete" && tab.url) {
//     console.log("Tab updated:", tab.url);

//     // Inject content script if needed
//     chrome.scripting
//       .executeScript({
//         target: { targetTabId },
//         files: ["content.js"],
//       })
//       .catch((error) => {
//         console.error("Could not inject content script:", error);
//       });
//   }
// });

// =======================================================
// ГОЛОВНИЙ ОБРОБНИК ПОВІДОМЛЕНЬ
// =======================================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Використовуємо async IIFE для обробки асинхронних операцій
  (async () => {
    const targetTabId = sender.tab?.id || (await getActiveTabId());
    let response: any = { success: true }; // Відповідь за замовчуванням

    try {
      switch (message.type) {
        case MessageType.START_CAPTION_RECORDING:
        case MessageType.STOP_CAPTION_RECORDING:
        case MessageType.PAUSE_CAPTION_RECORDING:
        case MessageType.RESUME_CAPTION_RECORDING:
        case MessageType.HARD_STOP_CAPTION_RECORDING:
        case MessageType.HARD_STOP_CAPTION_RECORDING:
        case MessageType.ENABLE_CAPTIONS:
        case MessageType.DISABLE_CAPTIONS:
          if (targetTabId) {
            response = await chrome.tabs.sendMessage(targetTabId, message);
          } else {
            throw new Error(
              "Cannot process recording command: sender tab ID is missing."
            );
          }
          break;

        // --- 2. Звіт про зміну стану (від Content до Background) ---
        case MessageType.STATE_UPDATED:
          if (targetTabId) {
            await StateManager.updateState(targetTabId, message.data);
            await broadcastStateUpdate(message.data);
          }
          break;

        // --- 3. Команди, що читають стан (від UI до Background) ---
        case MessageType.GET_CAPTION_STATUS:
          // Спочатку намагаємося отримати стан з session storage (глобальний стан)
          const sessionState = await chrome.storage.session.get(
            "caption_session_state"
          );
          let state = sessionState.caption_session_state;

          if (!state) {
            // Fallback до стану конкретної вкладки
            const requestingTabId = targetTabId || (await getActiveTabId());
            state = requestingTabId
              ? await StateManager.getState(requestingTabId)
              : null;
          }

          // Отримуємо поточний стан розширення з налаштувань
          const settings = await SettingsManager.getSettings();

          // Отримуємо інформацію про платформу від активного табу
          let platformInfo = {
            isSupportedPlatform: false,
            currentPlatform: "unknown",
          };
          try {
            const [activeTab] = await chrome.tabs.query({
              active: true,
              currentWindow: true,
            });

            if (activeTab?.id) {
              console.log(
                "📡 [BACKGROUND] Getting platform info from tab:",
                activeTab.url
              );
              const platformResponse = await chrome.tabs.sendMessage(
                activeTab.id,
                {
                  type: "GET_PLATFORM_INFO",
                }
              );
              console.log(
                "📡 [BACKGROUND] Raw platform response:",
                platformResponse
              );
              if (platformResponse && platformResponse.success) {
                platformInfo = platformResponse;
                console.log(
                  "📡 [BACKGROUND] Platform info received:",
                  platformInfo
                );
              } else {
                console.warn(
                  "📡 [BACKGROUND] No platform response received or failed:",
                  platformResponse
                );
              }
            } else {
              console.warn("📡 [BACKGROUND] No active tab found");
            }
          } catch (error) {
            console.warn(
              "Failed to get platform info from content script:",
              error
            );
          }

          if (state) {
            state.isExtensionEnabled = settings.extensionActive;
            state.isSupportedPlatform = platformInfo.isSupportedPlatform;
            state.currentPlatform = platformInfo.currentPlatform;
          } else {
            // Якщо стану немає, створюємо базовий
            state = {
              isInitialized: false,
              isSupportedPlatform: platformInfo.isSupportedPlatform,
              isInMeeting: false,
              isRecording: false,
              isPaused: false,
              isExtensionEnabled: settings.extensionActive,
              isPanelVisible: settings.floatPanelVisible,
              currentPlatform: platformInfo.currentPlatform,
              isError: undefined,
            };
          }

          response = state;
          break;

        // --- 4. Делегування іншим менеджерам ---
        case MessageType.SAVE_CAPTION_DATA:
          response = await SessionManager.saveSessionData(message, sender);
          break;

        case MessageType.BACKUP_CAPTION_DATA:
          response = await SessionManager.createBackup(message, sender);
          break;

        case MessageType.CHECK_BACKUP_RECOVERY:
          response = await SessionManager.checkBackupRecovery(message, sender);
          break;

        case MessageType.GET_CAPTION_HISTORY:
          response = await SessionManager.getSessionHistory();
          break;

        case MessageType.CLEAR_CAPTION_HISTORY:
          response = await SessionManager.clearSessionHistory();
          break;

        case MessageType.ADD_BACKUP_TO_HISTORY:
          response = await SessionManager.addBackupToHistory();
          break;

        case MessageType.CLEAR_CAPTION_BACKUP:
          response = await SessionManager.clearBackup();
          break;

        case MessageType.CLEANUP_EMPTY_HISTORY:
          await SessionManager.cleanupEmptyHistoryEntries();
          break;

        case MessageType.EXPORT_CAPTION_DATA:
          response = await handleExportCaptionData(message);
          break;

        case MessageType.UPDATE_BADGE_STATUS:
          BadgeManager.updateRecordingStatus(targetTabId, message.isRecording);
          break;

        case MessageType.UPDATE_SETTINGS:
          await SettingsManager.updateSettings(message.settings);
          break;

        case MessageType.TOGGLE_EXTENSION_STATE:
          console.log("📡 [BACKGROUND] Processing TOGGLE_EXTENSION_STATE");
          const newExtensionState =
            await SettingsManager.toggleExtensionState();
          console.log(
            `📡 [BACKGROUND] Extension state toggled to: ${newExtensionState}`
          );

          // Передаємо команду до content script
          try {
            const [activeTab] = await chrome.tabs.query({
              active: true,
              currentWindow: true,
            });

            if (activeTab?.id) {
              await chrome.tabs.sendMessage(activeTab.id, {
                type: MessageType.TOGGLE_EXTENSION_STATE,
                isEnabled: newExtensionState,
              });
              console.log(
                "📡 [BACKGROUND] TOGGLE_EXTENSION_STATE sent to content script"
              );
            }
          } catch (error) {
            console.warn(
              "Failed to send TOGGLE_EXTENSION_STATE to content script:",
              error
            );
          }

          // Відправляємо повідомлення до всіх UI компонентів
          try {
            await chrome.runtime.sendMessage({
              type: MessageType.TOGGLE_EXTENSION_STATE,
              isEnabled: newExtensionState,
            });
            console.log(
              "📡 [BACKGROUND] TOGGLE_EXTENSION_STATE sent to UI components"
            );
          } catch (error) {
            console.warn(
              "Failed to send TOGGLE_EXTENSION_STATE to UI components:",
              error
            );
          }

          response = { success: true, isEnabled: newExtensionState };
          break;

        case MessageType.TOGGLE_PANEL_VISIBILITY:
          console.log("📡 [BACKGROUND] Processing TOGGLE_PANEL_VISIBILITY");
          const isVisible = await SettingsManager.toggleFloatPanelVisibility();
          console.log(
            `📡 [BACKGROUND] Panel visibility toggled to: ${isVisible}`
          );

          // Передаємо команду до content script
          try {
            const [activeTab] = await chrome.tabs.query({
              active: true,
              currentWindow: true,
            });

            if (activeTab?.id) {
              await chrome.tabs.sendMessage(activeTab.id, {
                type: MessageType.TOGGLE_PANEL_VISIBILITY,
              });
              console.log(
                "📡 [BACKGROUND] TOGGLE_PANEL_VISIBILITY sent to content script"
              );
            }
          } catch (error) {
            console.warn(
              "Failed to send TOGGLE_PANEL_VISIBILITY to content script:",
              error
            );
          }

          response = { success: true, isVisible };
          break;

        case "GET_CURRENT_TAB":
          const [activeTab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });
          response = activeTab;
          break;

        // --- Нові кейси для автентифікації ---
        case "AUTH_SESSION_FROM_PAGE":
          console.log("📡 [BACKGROUND] Processing AUTH_SESSION_FROM_PAGE");
          if (message.payload?.session) {
            await AuthManager.saveSession(message.payload.session);
            console.log("📡 [BACKGROUND] Auth session saved");
          }
          response = { success: true };
          break;

        case "AUTH_SESSION_CLEARED":
          console.log("📡 [BACKGROUND] Processing AUTH_SESSION_CLEARED");
          await AuthManager.clearSession();
          console.log("📡 [BACKGROUND] Auth session cleared");
          response = { success: true };
          break;

        case "GET_AUTH_STATUS":
          console.log("📡 [BACKGROUND] Processing GET_AUTH_STATUS");
          const authSession = await AuthManager.getSession();
          const authIsAuthenticated = await AuthManager.isAuthenticated();
          const authTokenExpiry = await AuthManager.getTokenExpiry();
          const authUser = await AuthManager.getUser();

          response = {
            success: true,
            isAuthenticated: authIsAuthenticated,
            session: authSession,
            tokenExpiry: authTokenExpiry?.toISOString(),
            user: authUser,
          };
          break;

        case "REFRESH_TOKEN":
          console.log("📡 [BACKGROUND] Processing REFRESH_TOKEN");
          await AuthManager.refreshToken();
          const newTokenExpiry = await AuthManager.getTokenExpiry();

          response = {
            success: true,
            expiresAt: newTokenExpiry?.toISOString(),
          };
          break;

        default:
          console.warn(
            "Unknown message type received in background:",
            message.type
          );
          response = { success: false, error: "Unknown message type" };
      }

      sendResponse(response);
    } catch (error) {
      console.error(`Error handling message type "${message.type}":`, error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  })();

  return true; // Важливо для асинхронних відповідей
});

async function broadcastStateUpdate(newState: CaptionState): Promise<void> {
  try {
    console.log("📡 [BACKGROUND] Broadcasting state update:", newState);

    await chrome.storage.session.set({
      caption_session_state: newState,
    });

    await chrome.runtime.sendMessage({
      type: MessageType.STATE_UPDATED,
      data: newState,
    });

    console.log("📡 [BACKGROUND] State update broadcasted successfully");
  } catch (error) {
    console.log(
      "Broadcast info: Could not send message to runtime listeners (e.g., popup). They might be closed."
    );
  }
}

chrome.tabs.onRemoved.addListener((targetTabId) => {
  StateManager.clearState(targetTabId);
});

// Обробник для "будильника" оновлення токенів
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "refreshTokenAlarm") {
    console.log("📡 [BACKGROUND] Token refresh alarm triggered");
    AuthManager.refreshToken();
  }
});

async function getActiveTabId(): Promise<number | undefined> {
  const [activeTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  return activeTab?.id;
}

async function handleExportCaptionData(
  message: any
): Promise<{ success: boolean; filename?: string; error?: string }> {
  const { sessionId, format = "json" } = message.data;

  const sessionData = await SessionManager.getSessionDataForExport(sessionId);

  if (!sessionData) {
    throw new Error("Session data not found for export.");
  }

  const filename = await ExportManager.exportSessionData(sessionData, format);
  return { success: true, filename };
}
