/**
 * SessionManager - manages sessions, memory and backups
 */

import type { SessionData, SessionState } from "../../types/session";

const CAPTION_STORAGE_KEYS = {
  HISTORY: "CAPTION_HISTORY",
  LAST_SESSION: "CURRENT_CAPTION_SESSION",
  SETTINGS: "CAPTION_SETTINGS",
  BACKUP: "CAPTION_BACKUP",
} as const;

const LAST_INTERRUPTED_ID_KEY = "lastInterruptedSessionId";

export class SessionManager {
  private static generateSessionId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  static async saveSession(sessionData: SessionData): Promise<void> {
    try {
      if (!this.hasData(sessionData)) {
        console.log(
          "[SessionManager] Skipped saving: session contains no data."
        );
        return;
      }

      const { [CAPTION_STORAGE_KEYS.HISTORY]: currentHistory = [] } =
        await chrome.storage.local.get(CAPTION_STORAGE_KEYS.HISTORY);
      let updatedHistory = [...currentHistory];

      // @ts-ignore
      const oldSessionId = sessionData.meetingInfo?.recoveringFromId;
      if (oldSessionId) {
        updatedHistory = updatedHistory.filter(
          (session: any) => session.id !== oldSessionId
        );
        console.log(
          `[SessionManager] Removed old interrupted session ${oldSessionId} from history.`
        );
      }

      // Виключаємо sessionState та створюємо новий об'єкт з усіма іншими полями
      const { sessionState, ...sessionDataWithoutState } = sessionData;

      const newSessionObject: any = {
        ...sessionDataWithoutState,
        id: this.generateSessionId(),
        timestamp: new Date().toISOString(),
      };

      updatedHistory.unshift(newSessionObject);

      const toStore: { [key: string]: any } = {
        [CAPTION_STORAGE_KEYS.HISTORY]: updatedHistory,
      };

      if (sessionData.isBackup) {
        toStore[LAST_INTERRUPTED_ID_KEY] = newSessionObject.id;
      }

      await chrome.storage.local.set(toStore);
      console.log(
        `[SessionManager] Session ${newSessionObject.id} saved successfully.`
      );
    } catch (error) {
      console.error("❌ [SessionManager] Failed to save session:", error);
    }
  }
  static async getAndPrepareBackupForUrl(
    url: string
  ): Promise<SessionData | null> {
    const store = await chrome.storage.local.get([
      LAST_INTERRUPTED_ID_KEY,
      CAPTION_STORAGE_KEYS.HISTORY,
    ]);
    const backupId = store[LAST_INTERRUPTED_ID_KEY];
    const history = store[CAPTION_STORAGE_KEYS.HISTORY] || [];

    if (!backupId) return null;

    const backupSession = history.find((s: any) => s.id === backupId);
    if (!backupSession) return null;

    const isSameMeeting =
      new URL(backupSession.url).pathname === new URL(url).pathname;

    if (isSameMeeting) {
      console.log(
        `[SessionManager] Matching session ${backupId} found. Preparing for recovery.`
      );
      await chrome.storage.local.remove(LAST_INTERRUPTED_ID_KEY);

      const stateToRecover: SessionData = {
        ...backupSession,
        isBackup: true,
        sessionState: {
          state: "paused",
          isInitializedAdapter: true,
          isInMeeting: true,
          isSupportedPlatform: true,
          isExtensionEnabled: true,
          isPanelVisible: true,
          error: undefined,
          currentPlatform: "unknown",
        },
        recordTimings: {
          ...backupSession.recordTimings,
          lastPauseTime: new Date().toISOString(),
        },
      };
      // @ts-ignore
      stateToRecover.meetingInfo.recoveringFromId = backupId;
      return stateToRecover;
    } else {
      await chrome.storage.local.remove(LAST_INTERRUPTED_ID_KEY);
      return null;
    }
  }

  /**
   * Checks if backup contains any data
   */
  static hasData(backupData: any): boolean {
    if (!backupData) return false;

    const hasCaptions = backupData.captions && backupData.captions.length > 0;
    const hasChatMessages =
      backupData.chatMessages && backupData.chatMessages.length > 0;
    const hasAttendeeReport =
      backupData.attendeeReport &&
      (backupData.attendeeReport.attendeeList?.length > 0 ||
        backupData.attendeeReport.currentAttendees?.length > 0);

    return hasCaptions || hasChatMessages || hasAttendeeReport;
  }

  /**
   * Gets session history
   */
  static async getSessionHistory(): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      const { [CAPTION_STORAGE_KEYS.HISTORY]: history = [] } =
        await chrome.storage.local.get(CAPTION_STORAGE_KEYS.HISTORY);
      return { success: true, data: history };
    } catch (error) {
      console.error("Failed to get caption history:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Clears session history
   */
  static async clearSessionHistory() {
    try {
      await chrome.storage.local.remove([
        CAPTION_STORAGE_KEYS.HISTORY,
        CAPTION_STORAGE_KEYS.LAST_SESSION,
      ]);
    } catch (error) {}
  }

  /**
   * Exports the session (replacement for handleExportCaptionData)
   */
  static async exportSession(
    sessionId?: string,
    format: string = "json"
  ): Promise<{ success: boolean; filename?: string; error?: string }> {
    try {
      let sessionData;

      if (sessionId) {
        const historyResult = await this.getSessionHistory();
        if (!historyResult.success || !historyResult.data) {
          return { success: false, error: "Failed to get history" };
        }
        sessionData = historyResult.data.find(
          (session: any) => session.id === sessionId
        );
      } else {
        const { currentCaptionSession: current } =
          await chrome.storage.local.get("currentCaptionSession");
        sessionData = current;
      }

      if (!sessionData) {
        return { success: false, error: "Session not found" };
      }

      const { ExportManager } = await import("./ExportManager");
      const filename = await ExportManager.exportSessionData(
        sessionData,
        format
      );
      return { success: true, filename };
    } catch (error) {
      console.error("Failed to export session:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
