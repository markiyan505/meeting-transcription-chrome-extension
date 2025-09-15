/**
 * SessionManager - manages sessions, memory and backups
 */

import type { SessionData } from "../../types/session";

// Caption data storage keys
const CAPTION_STORAGE_KEYS = {
  HISTORY: "captionHistory",
  LAST_SESSION: "currentCaptionSession",
  SETTINGS: "captionSettings",
  BACKUP: "captionBackup",
} as const;

export class SessionManager {
  /**
   * Generates unique session ID
   */
  private static generateSessionId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Creates unified session data for saving or backup
   */
  static createSessionData(
    message: any,
    sender: chrome.runtime.MessageSender,
    isBackup: boolean = false
  ): SessionData {
    const baseData: SessionData = {
      id: this.generateSessionId(),
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

  static async getSessionDataForExport(
    sessionId?: string
  ): Promise<SessionData | null> {
    if (sessionId) {
      const historyResult = await this.getSessionHistory();
      if (historyResult.success && historyResult.data) {
        return (
          historyResult.data.find(
            (session: SessionData) => session.id === sessionId
          ) || null
        );
      }
      return null;
    } else {
      const { [CAPTION_STORAGE_KEYS.LAST_SESSION]: current } =
        await chrome.storage.local.get(CAPTION_STORAGE_KEYS.LAST_SESSION);
      return current || null;
    }
  }
  /**
   * Saves session data
   */
  static async saveSessionData(
    message: any,
    sender: chrome.runtime.MessageSender
  ): Promise<{
    success: boolean;
    sessionId?: string;
    skipped?: boolean;
    reason?: string;
    message?: string;
    error?: string;
  }> {
    try {
      const sessionData = this.createSessionData(message, sender, false);

      if (!this.hasData(sessionData)) {

        return {
          success: false,
          skipped: true,
          reason: "No data in session",
          message: "No data to save. Recording was empty.",
        };
      }

      await chrome.storage.local.set({
        [CAPTION_STORAGE_KEYS.LAST_SESSION]: sessionData,
      });

      const { [CAPTION_STORAGE_KEYS.HISTORY]: history = [] } =
        await chrome.storage.local.get(CAPTION_STORAGE_KEYS.HISTORY);
      const updatedHistory = [sessionData, ...history].slice(0, 50); 

      await chrome.storage.local.set({
        [CAPTION_STORAGE_KEYS.HISTORY]: updatedHistory,
      });

      await chrome.storage.local.remove(CAPTION_STORAGE_KEYS.BACKUP);


      return { success: true, sessionId: sessionData.id };
    } catch (error) {
      console.error("❌ [SAVE] Failed to save caption data:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Creates session data backup
   */
  static async createBackup(
    message: any,
    sender: chrome.runtime.MessageSender
  ): Promise<{ success: boolean; backupId?: string; error?: string }> {
    try {
      const backupData = this.createSessionData(message, sender, true);

      await chrome.storage.local.set({
        [CAPTION_STORAGE_KEYS.BACKUP]: backupData,
      });

      return { success: true, backupId: backupData.id };
    } catch (error) {
      console.error("❌ [BACKUP] Failed to backup caption data:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
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
  static async clearSessionHistory(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await chrome.storage.local.remove([
        CAPTION_STORAGE_KEYS.HISTORY,
        CAPTION_STORAGE_KEYS.LAST_SESSION,
      ]);
      return { success: true };
    } catch (error) {
      console.error("Failed to clear caption history:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Adds backup to history
   */
  static async addBackupToHistory(): Promise<{
    success: boolean;
    skipped?: boolean;
    reason?: string;
    error?: string;
  }> {
    try {
      const { [CAPTION_STORAGE_KEYS.BACKUP]: backupData } =
        await chrome.storage.local.get(CAPTION_STORAGE_KEYS.BACKUP);

      if (!backupData) {
        return { success: false, error: "No backup data found" };
      }

      if (!this.hasData(backupData)) {

        return {
          success: true,
          skipped: true,
          reason: "No data in backup",
        };
      }

      const { [CAPTION_STORAGE_KEYS.HISTORY]: history = [] } =
        await chrome.storage.local.get(CAPTION_STORAGE_KEYS.HISTORY);

      const updatedHistory = [backupData, ...history].slice(0, 50);

      await chrome.storage.local.set({
        [CAPTION_STORAGE_KEYS.HISTORY]: updatedHistory,
      });


      return { success: true };
    } catch (error) {
      console.error("❌ [BACKUP] Failed to add backup to history:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Checks and restores backup when entering meeting
   */
  static async checkBackupRecovery(
    message: any,
    sender: chrome.runtime.MessageSender
  ): Promise<{
    success: boolean;
    shouldRecover?: boolean;
    data?: any;
    source?: string;
    clearedBackup?: boolean;
    error?: string;
  }> {
    try {
      const { [CAPTION_STORAGE_KEYS.BACKUP]: backupData } =
        await chrome.storage.local.get(CAPTION_STORAGE_KEYS.BACKUP);

      if (!backupData) {
        return { success: true, shouldRecover: false };
      }

      const currentUrl = message.currentUrl || sender.tab?.url || "unknown";
      const backupUrl = backupData.url;

      const isSameMeeting = this.isSameMeetingUrl(currentUrl, backupUrl);

      if (isSameMeeting) {
        await this.removeBackupFromHistory(backupData.id);

        return {
          success: true,
          shouldRecover: true,
          data: backupData,
          source: "backup",
        };
      } else {
        await chrome.storage.local.remove(CAPTION_STORAGE_KEYS.BACKUP);

        return {
          success: true,
          shouldRecover: false,
          clearedBackup: true,
        };
      }
    } catch (error) {
      console.error("❌ [RECOVERY] Failed to check backup recovery:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Clears backup data
   */
  static async clearBackup(): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      await chrome.storage.local.remove(CAPTION_STORAGE_KEYS.BACKUP);

      return {
        success: true,
        message: "Backup cleared successfully",
      };
    } catch (error) {
      console.error("❌ [CLEAR BACKUP] Failed to clear caption backup:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Clears empty entries from history
   */
  static async cleanupEmptyHistoryEntries(): Promise<void> {
    try {
      const { [CAPTION_STORAGE_KEYS.HISTORY]: history = [] } =
        await chrome.storage.local.get(CAPTION_STORAGE_KEYS.HISTORY);

      const cleanedHistory = history.filter((session: any) => {
        return this.hasData(session);
      });

      if (cleanedHistory.length !== history.length) {
        await chrome.storage.local.set({
          [CAPTION_STORAGE_KEYS.HISTORY]: cleanedHistory,
        });

      }
    } catch (error) {
      console.error(
        "❌ [CLEANUP] Failed to cleanup empty history entries:",
        error
      );
    }
  }

  /**
   * Checks if the same meeting URL
   */
  private static isSameMeetingUrl(
    currentUrl: string,
    backupUrl: string
  ): boolean {
    try {
      const current = new URL(currentUrl);
      const backup = new URL(backupUrl);

      return (
        current.hostname === backup.hostname &&
        current.pathname === backup.pathname
      );
    } catch {
      return false;
    }
  }

  /**
   * Removes backup from history by ID
   */
  private static async removeBackupFromHistory(
    backupId: string
  ): Promise<void> {
    const { [CAPTION_STORAGE_KEYS.HISTORY]: history = [] } =
      await chrome.storage.local.get(CAPTION_STORAGE_KEYS.HISTORY);

    const updatedHistory = history.filter(
      (session: any) => session.id !== backupId
    );

    await chrome.storage.local.set({
      [CAPTION_STORAGE_KEYS.HISTORY]: updatedHistory,
    });
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
