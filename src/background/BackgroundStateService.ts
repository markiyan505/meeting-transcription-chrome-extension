import type { ErrorType, SessionData, SessionState } from "@/types/session";

import type {
  ChromeMessage,
  StateChangedEvent,
  StartRecordingCommand,
  StopRecordingCommand,
  PauseRecordingCommand,
  ResumeRecordingCommand,
  DeleteRecordingCommand,
  ReportCommandFailedCommand,
  DisablePanelVisibilityCommand,
  UpsertSessionDataCommand,
  RecoverFromBackupCommand,
  EnablePanelVisibilityCommand,
  ContextStateChangedEvent,
  ContextDataChangedEvent,
} from "@/types/messages";

import {
  ActiveSessionsBackup,
  PlatformType,
  RecordTimings,
  sessionDataDefault,
} from "@/types/session";
import { SettingsManager } from "./modules/SettingsManager";
import { SessionManager } from "./modules/SessionManager";
import { SettingsConfig, GeneralSettings } from "@/types/settings";

type SaveSessionFn = (sessionData: SessionData) => Promise<any>;

const ACTIVE_SESSIONS_BACKUP_KEY = "active_sessions_backup";

export class BackgroundStateService {
  private tabsSessionData: Map<number, SessionData> = new Map();
  private saveSession: SaveSessionFn;

  constructor(saveSessionFunction: SaveSessionFn) {
    this.saveSession = saveSessionFunction;
    this.saveBackupSessionsToStorage();
  }

  public async handleContentScriptReady(tabId: number): Promise<void> {
    console.log(`[StateService] Content script ready for tab ${tabId}`);
    const settings = await SettingsManager.getSettings();
    const initialData = this.getTabData(tabId);

    const stateToInitialize: Partial<SessionData> = {
      ...initialData,
      sessionState: {
        ...initialData.sessionState,
        isExtensionEnabled: settings.generalSettings.isExtensionEnabled,
      },
    };

    this.updateTabState(tabId, stateToInitialize);
    this.sendCommandToTab(tabId, {
      type: "COMMAND.CONTENT.ENABLE",
      payload: { isEnabled: settings.generalSettings.isExtensionEnabled },
    });
  }

  public handleUnexpectedRecordEnding(tabId: number): void {
    const data = this.tabsSessionData.get(tabId);
    const state = data?.sessionState;
    if (!state) return;

    if (state.state == "resuming") state.state = "paused";

    if (state && (state.state === "recording" || state.state === "paused")) {
      data.isAutoSave = true;
      this.stopRecording(tabId);
    }
    this.tabsSessionData.delete(tabId);
  }

  public handleTabRemoval(tabId: number): void {
    this.handleUnexpectedRecordEnding(tabId);
  }

  public async handleMeetingStatusChanged(
    tabId: number,
    payload: { isInMeeting: boolean }
  ): Promise<void> {
    console.log(
      `[StateService] Meeting status changed in tab ${tabId}: ${payload.isInMeeting}`
    );

    if (payload.isInMeeting) {
      // При початку зустрічі перевіряємо backup
      await this.checkAndRecoverBackup(tabId);
    } else {
      this.handleUnexpectedRecordEnding(tabId);
    }

    this.updateTabSessionState(tabId, { isInMeeting: payload.isInMeeting });
  }

  private async checkAndRecoverBackup(tabId: number): Promise<void> {
    try {
      const tab = await chrome.tabs.get(tabId);
      const recoveredState = await SessionManager.getAndPrepareBackupForUrl(
        tab.url || ""
      );

      if (recoveredState) {
        console.log(`[StateService] Recovering backup state for tab ${tabId}`);

        this.tabsSessionData.set(tabId, recoveredState);

        this.sendCommandToTab<RecoverFromBackupCommand>(tabId, {
          type: "COMMAND.CONTENT.RECOVER_FROM_BACKUP",
          payload: { recoveredState },
        });
      }
    } catch (error) {
      console.error(
        `[StateService] Failed to check backup for tab ${tabId}:`,
        error
      );
    }
  }

  public handlePlatformInfo(
    tabId: number,
    payload: { isSupported: boolean; platform: PlatformType }
  ): void {
    this.updateTabSessionState(tabId, {
      isSupportedPlatform: payload.isSupported,
      currentPlatform: payload.platform,
    });
  }

  private async saveBackupSessionsToStorage(): Promise<void> {
    const result = await chrome.storage.local.get(ACTIVE_SESSIONS_BACKUP_KEY);
    const backedUpSessions: ActiveSessionsBackup =
      result[ACTIVE_SESSIONS_BACKUP_KEY];

    if (backedUpSessions) {
      console.log(
        "[StateService] Found backed up sessions, processing...",
        backedUpSessions
      );

      for (const tabIdStr in backedUpSessions) {
        const tabId = parseInt(tabIdStr);
        const SessionData = backedUpSessions[tabId];
        console.log(
          `[StateService] Saving interrupted session for closed tab ${tabId}`
        );
        await this.saveSession(SessionData);
      }

      await chrome.storage.local.remove(ACTIVE_SESSIONS_BACKUP_KEY);
    }
  }

  public async backupActiveSessions(): Promise<void> {
    const activeSessions: ActiveSessionsBackup = {};
    let hasActiveSessions = false;
    for (const [tabId, state] of this.tabsSessionData.entries()) {
      if (
        state.sessionState.state === "recording" ||
        state.sessionState.state === "paused" ||
        state.sessionState.state === "resuming"
      ) {
        state.isBackup = true;
        activeSessions[tabId] = state;
        hasActiveSessions = true;
      }
    }

    if (hasActiveSessions) {
      await chrome.storage.local.set({
        [ACTIVE_SESSIONS_BACKUP_KEY]: activeSessions,
      });
    } else {
      await chrome.storage.local.remove(ACTIVE_SESSIONS_BACKUP_KEY);
    }
  }

  // TODO Додати логіку для обробки інших команд
  public handleCommandFailed(
    tabId: number,
    payload: {
      errorType: ErrorType;
      failedCommandType: string;
    }
  ): void {
    const state = this.getTabData(tabId);

    this.updateTabSessionState(tabId, {
      state: "error",
      error: payload.errorType,
    });
  }

  public startRecording(tabId: number): void {
    const state = this.getTabData(tabId);
    if (state.sessionState.state !== "idle") return;

    this.updateTabSessionState(tabId, { state: "starting" });

    this.sendCommandToTab<StartRecordingCommand>(tabId, {
      type: "COMMAND.RECORDING.START",
    });
  }

  public handleRecordingStarted(tabId: number): void {
    const state = this.getTabData(tabId);
    if (state.sessionState.state !== "starting") return;

    this.updateTabRecordTimings(tabId, {
      startTime: new Date().toISOString(),
    });

    this.updateTabSessionState(tabId, { state: "recording" });
  }

  public resumeRecording(tabId: number): void {
    const state = this.getTabData(tabId);
    if (state.sessionState.state !== "paused") return;

    this.updateTabSessionState(tabId, { state: "resuming" });
    this.sendCommandToTab<ResumeRecordingCommand>(tabId, {
      type: "COMMAND.RECORDING.RESUME",
    });
  }

  public handleRecordingResumed(tabId: number): void {
    const state = this.getTabData(tabId);
    if (state.sessionState.state !== "resuming") return;

    this.updateTabSessionState(tabId, { state: "recording" });
  }

  public stopRecording(tabId: number): void {
    const state = this.getTabData(tabId);
    if (
      state.sessionState.state !== "recording" &&
      state.sessionState.state !== "paused"
    )
      return;

    this.updateTabRecordTimings(tabId, {
      endTime: new Date().toISOString(),
      totalDuration: this.calcTotalDuration(state.recordTimings),
    });

    const finalSessionData = this.getTabData(tabId);
    this.saveSession(finalSessionData).catch((err) =>
      console.error(
        `[StateService] Session saving failed for tab ${tabId}:`,
        err
      )
    );

    this.updateTabSessionState(tabId, {
      state: "idle",
      error: undefined,
    });
    this.updateTabState(tabId, {
      captions: [],
      chatMessages: [],
      attendeeEvents: [],
      recordTimings: {},
    });

    this.sendCommandToTab<StopRecordingCommand>(tabId, {
      type: "COMMAND.RECORDING.STOP",
    });
  }

  public calcTotalDuration(recordTimings: RecordTimings): number {
    const currentTime = new Date().getTime();
    const startTime = recordTimings.startTime
      ? new Date(recordTimings.startTime).getTime()
      : 0;
    const lastPauseTime = recordTimings.lastPauseTime
      ? new Date(recordTimings.lastPauseTime).getTime()
      : 0;
    const totalDuration = recordTimings.totalDuration || 0;
    return totalDuration + (currentTime - lastPauseTime || startTime);
  }

  public pauseRecording(tabId: number): void {
    const state = this.getTabData(tabId);
    if (state.sessionState.state !== "recording") return;

    this.updateTabRecordTimings(tabId, {
      lastPauseTime: new Date().toISOString(),
      totalDuration: this.calcTotalDuration(state.recordTimings),
    });

    this.updateTabSessionState(tabId, { state: "paused" });
    this.sendCommandToTab<PauseRecordingCommand>(tabId, {
      type: "COMMAND.RECORDING.PAUSE",
    });
  }

  public deleteRecording(tabId: number): void {
    const state = this.getTabData(tabId);
    if (
      state.sessionState.state !== "recording" &&
      state.sessionState.state !== "paused"
    )
      return;

    this.updateTabSessionState(tabId, {
      state: "idle",
      error: undefined,
    });
    this.updateTabState(tabId, {
      captions: [],
      chatMessages: [],
      attendeeEvents: [],
      recordTimings: {},
    });

    this.sendCommandToTab<DeleteRecordingCommand>(tabId, {
      type: "COMMAND.RECORDING.DELETE",
    });
  }

  public togglePanelVisibility(tabId: number): void {
    const state = this.getTabData(tabId);
    const newVisibility = !state.sessionState.isPanelVisible;
    console.log(
      `[StateService] Toggling panel visibility for tab ${tabId}: ${state.sessionState.isPanelVisible} -> ${newVisibility}`
    );

    this.updateTabSessionState(tabId, { isPanelVisible: newVisibility });

    if (newVisibility) {
      this.sendCommandToTab<EnablePanelVisibilityCommand>(tabId, {
        type: "COMMAND.PANEL.TOGGLE_ENABLED",
      });
    } else {
      this.sendCommandToTab<DisablePanelVisibilityCommand>(tabId, {
        type: "COMMAND.PANEL.TOGGLE_DISABLED",
      });
    }
  }

  public upsertData(
    tabId: number,
    payload: UpsertSessionDataCommand["payload"]
  ): void {
    if (!payload) return;

    const state = this.getTabData(tabId);
    if (state.sessionState.state !== "recording") return;

    const captionsMap = new Map(state.captions.map((c) => [c.id, c]));
    payload.captions?.forEach((caption) =>
      captionsMap.set(caption.id, caption)
    );

    this.tabsSessionData.set(tabId, {
      ...state,
      captions: Array.from(captionsMap.values()),
      chatMessages: [...state.chatMessages, ...(payload.chatMessages || [])],
      attendeeEvents: [
        ...state.attendeeEvents,
        ...(payload.attendeeEvents || []),
      ],
      meetingInfo: { ...state.meetingInfo, ...payload.meetingInfo },
    });
  }

  public async getAppState(tabId: number): Promise<{ state: SessionState }> {
    const tabData = this.getTabData(tabId);
    const settings = await SettingsManager.getSettings();

    return {
      state: {
        ...tabData.sessionState,
        isExtensionEnabled: settings.generalSettings.isExtensionEnabled,
      },
    };
  }

  private getTabData(tabId: number): SessionData {
    return this.tabsSessionData.get(tabId) || { ...sessionDataDefault };
  }

  public getTabState(tabId: number): SessionState {
    return this.getTabData(tabId).sessionState;
  }

  public updateTabState(
    tabId: number,
    newState: Partial<SessionData>,
    forceBroadcast: boolean = false
  ): void {
    const currentState = this.getTabData(tabId);
    const updatedState = { ...currentState, ...newState };

    console.log(
      `[StateService] Updating tab state for tab ${tabId}:`,
      newState
    );

    const hasStateChanged = this.hasStateChanged(currentState, updatedState);
    this.tabsSessionData.set(tabId, updatedState);

    if (hasStateChanged || forceBroadcast) {
      console.log(
        `[StateService] Tab state changed, broadcasting for tab ${tabId}`
      );
      this.broadcastStateToContentScript(updatedState, tabId);
    } else {
      console.log(
        `[StateService] No tab state change detected for tab ${tabId}`
      );
    }
  }

  public broadcastStateToUI(newState: SessionState, sourceTabId: number): void {
    const event: StateChangedEvent = {
      type: "EVENT.STATE_CHANGED",
      payload: { newState, sourceTabId },
    };

    chrome.runtime.sendMessage(event).catch((error) => {
      if (!error.message.includes("Receiving end does not exist")) {
        console.warn(
          `[StateService] Помилка при трансляції стану в UI:`,
          error
        );
      }
    });
  }

  private broadcastStateToContentScript(
    newState: SessionData,
    sourceTabId: number
  ): void {
    const event: ContextDataChangedEvent = {
      type: "EVENT.CONTEXT_DATA_CHANGED",
      payload: { newState, sourceTabId },
    };

    console.log(
      "[StateService] Broadcasting state to content script:",
      sourceTabId
    );

    if (sourceTabId) {
      chrome.tabs.sendMessage(sourceTabId, event).catch(() => {});
    }
  }

  public async broadcastStateToAllContexts(
    newState: Partial<GeneralSettings>,
    sourceTabId: number
  ): Promise<void> {
    console.log("[StateService] Broadcasting state to all contexts.");
    const state = this.getTabData(sourceTabId).sessionState;
    const updatedState = { ...state, ...newState };

    this.broadcastStateToUI(updatedState, sourceTabId);

    try {
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.id) {
          const state = this.getTabData(tab.id).sessionState;
          const updatedState = { ...state, ...newState };

          const event: ContextStateChangedEvent = {
            type: "EVENT.CONTEXT_STATE_CHANGED",
            payload: { updatedState },
          };

          chrome.tabs.sendMessage(tab.id, event).catch(() => {});
        }
      }
      console.log("[StateService] Broadcasted state to all contexts.");
    } catch (error) {
      console.error(
        `[StateService] Failed to broadcast state change to all contexts:`,
        error
      );
    }
  }

  public updateTabRecordTimings(
    tabId: number,
    newRecordTimings: Partial<RecordTimings>
  ): void {
    const currentData = this.getTabData(tabId);
    const updatedData = {
      ...currentData,
      recordTimings: { ...currentData.recordTimings, ...newRecordTimings },
    };

    this.tabsSessionData.set(tabId, updatedData);
  }

  public updateTabSessionState(
    tabId: number,
    newSessionState: Partial<SessionState>,
    forceBroadcast: boolean = false
  ): void {
    const currentData = this.getTabData(tabId);
    const updatedData = {
      ...currentData,
      sessionState: { ...currentData.sessionState, ...newSessionState },
    };

    console.log(
      `[StateService] Updating session state for tab ${tabId}:`,
      newSessionState
    );

    const hasStateChanged = this.hasStateChanged(currentData, updatedData);
    this.tabsSessionData.set(tabId, updatedData);

    if (hasStateChanged || forceBroadcast) {
      console.log(
        `[StateService] State changed, broadcasting for tab ${tabId}`
      );
      this.broadcastStateToUI(updatedData.sessionState, tabId);
    } else {
      console.log(`[StateService] No state change detected for tab ${tabId}`);
    }
  }

  private hasStateChanged(
    currentState: SessionData,
    newState: SessionData
  ): boolean {
    const relevantFields: (keyof SessionState)[] = [
      "isExtensionEnabled",
      "isInitializedAdapter",
      "state",
      "error",
      "isSupportedPlatform",
      "currentPlatform",
      "isInMeeting",
      "isPanelVisible",
    ];

    return relevantFields.some(
      (field) =>
        currentState.sessionState[field] !== newState.sessionState[field]
    );
  }

  private sendCommandToTab<T extends ChromeMessage>(
    tabId: number,
    command: T
  ): void {
    chrome.tabs.sendMessage(tabId, command).catch((error) => {
      console.warn(
        `[StateService] Failed to send command to tab ${tabId}:`,
        error
      );
    });
  }
}
