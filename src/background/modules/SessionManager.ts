/**
 * SessionManager - управління сесіями, пам'яттю та бекапами
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
   * Генерує унікальний ID сесії
   */
  private static generateSessionId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Створює уніфіковані дані сесії для збереження або бекапу
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
   * Перевіряє, чи містить бекап хоча б якісь дані
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


  static async getSessionDataForExport(sessionId?: string): Promise<SessionData | null> {
    if (sessionId) {
      const historyResult = await this.getSessionHistory();
      if (historyResult.success && historyResult.data) {
        return historyResult.data.find((session: SessionData) => session.id === sessionId) || null;
      }
      return null;
    } else {
      // Повертаємо останню збережену сесію
      const { [CAPTION_STORAGE_KEYS.LAST_SESSION]: current } = await chrome.storage.local.get(
        CAPTION_STORAGE_KEYS.LAST_SESSION
      );
      return current || null;
    }
  }
  /**
   * Зберігає дані сесії
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

      // Перевіряємо, чи є в записі хоча б якісь дані
      if (!this.hasData(sessionData)) {
        console.log("⚠️ [SAVE] Session contains no data, skipping save:", {
          id: sessionData.id,
          captions: sessionData.captions?.length || 0,
          chatMessages: sessionData.chatMessages?.length || 0,
          attendeeReport: !!sessionData.attendeeReport,
          meetingInfo: !!sessionData.meetingInfo,
        });

        return {
          success: false,
          skipped: true,
          reason: "No data in session",
          message: "No data to save. Recording was empty.",
        };
      }

      // Save current session
      await chrome.storage.local.set({
        [CAPTION_STORAGE_KEYS.LAST_SESSION]: sessionData,
      });

      // Add to history
      const { [CAPTION_STORAGE_KEYS.HISTORY]: history = [] } =
        await chrome.storage.local.get(CAPTION_STORAGE_KEYS.HISTORY);
      const updatedHistory = [sessionData, ...history].slice(0, 50); // Keep last 50 sessions

      await chrome.storage.local.set({
        [CAPTION_STORAGE_KEYS.HISTORY]: updatedHistory,
      });

      // Очищаємо бекап після успішного збереження
      await chrome.storage.local.remove(CAPTION_STORAGE_KEYS.BACKUP);

      console.log("✅ [SAVE] Caption data saved:", {
        id: sessionData.id,
        captions: sessionData.captions?.length || 0,
        chatMessages: sessionData.chatMessages?.length || 0,
        attendeeReport: !!sessionData.attendeeReport,
        meetingInfo: !!sessionData.meetingInfo,
      });

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
   * Створює бекап даних сесії
   */
  static async createBackup(
    message: any,
    sender: chrome.runtime.MessageSender
  ): Promise<{ success: boolean; backupId?: string; error?: string }> {
    try {
      const backupData = this.createSessionData(message, sender, true);

      // Зберігаємо бекап, замінюючи попередній бекап для цієї сесії
      await chrome.storage.local.set({
        [CAPTION_STORAGE_KEYS.BACKUP]: backupData,
      });

      console.log("💾 [BACKUP] Caption data backed up:", {
        id: backupData.id,
        captionCount: backupData.captions.length,
        chatMessageCount: backupData.chatMessages.length,
        timestamp: backupData.timestamp,
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
   * Отримує історію сесій
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
   * Очищає історію сесій
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
      console.log("Caption history cleared");
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
   * Додає бекап в історію
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

      // Перевіряємо, чи є в бекапі хоча б якісь дані
      if (!this.hasData(backupData)) {
        console.log("⚠️ [BACKUP] Backup contains no data, skipping history:", {
          id: backupData.id,
          captions: backupData.captions?.length || 0,
          chatMessages: backupData.chatMessages?.length || 0,
          attendeeReport: !!backupData.attendeeReport,
          meetingInfo: !!backupData.meetingInfo,
        });
        return {
          success: true,
          skipped: true,
          reason: "No data in backup",
        };
      }

      // Додаємо бекап в історію
      const { [CAPTION_STORAGE_KEYS.HISTORY]: history = [] } =
        await chrome.storage.local.get(CAPTION_STORAGE_KEYS.HISTORY);

      const updatedHistory = [backupData, ...history].slice(0, 50);

      await chrome.storage.local.set({
        [CAPTION_STORAGE_KEYS.HISTORY]: updatedHistory,
      });

      console.log("✅ [BACKUP] Backup added to history:", {
        id: backupData.id,
        captions: backupData.captions?.length || 0,
        chatMessages: backupData.chatMessages?.length || 0,
        attendeeReport: !!backupData.attendeeReport,
        meetingInfo: !!backupData.meetingInfo,
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
   * Перевіряє та відновлює бекап при вході в зустріч
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

      // Перевіряємо, чи це та ж зустріч (порівнюємо URL)
      const isSameMeeting = this.isSameMeetingUrl(currentUrl, backupUrl);

      if (isSameMeeting) {
        await this.removeBackupFromHistory(backupData.id);

        console.log("🔄 [RECOVERY] Recovering backup for same meeting:", {
          currentUrl,
          backupUrl,
          captionCount: backupData.captions?.length || 0,
        });

        return {
          success: true,
          shouldRecover: true,
          data: backupData,
          source: "backup",
        };
      } else {
        // Інша зустріч - просто видаляємо бекап
        await chrome.storage.local.remove(CAPTION_STORAGE_KEYS.BACKUP);

        console.log("🧹 [CLEANUP] Cleared backup for different meeting:", {
          currentUrl,
          backupUrl,
        });

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
   * Очищає бекап дані
   */
  static async clearBackup(): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      console.log("🧹 [CLEAR BACKUP] Clearing caption backup data...");

      // Очищаємо backup
      await chrome.storage.local.remove(CAPTION_STORAGE_KEYS.BACKUP);
      console.log("✅ [CLEAR BACKUP] Caption backup cleared successfully");

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
   * Очищає порожні записи з історії
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

        console.log(
          `🧹 [CLEANUP] Removed ${
            history.length - cleanedHistory.length
          } empty entries from history`
        );
      }
    } catch (error) {
      console.error(
        "❌ [CLEANUP] Failed to cleanup empty history entries:",
        error
      );
    }
  }

  /**
   * Перевіряє, чи це та ж зустріч за URL
   */
  private static isSameMeetingUrl(
    currentUrl: string,
    backupUrl: string
  ): boolean {
    try {
      const current = new URL(currentUrl);
      const backup = new URL(backupUrl);

      // Порівнюємо домен та шлях (без query параметрів)
      return (
        current.hostname === backup.hostname &&
        current.pathname === backup.pathname
      );
    } catch {
      return false;
    }
  }

  /**
   * Видаляє бекап з історії за ID
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

    console.log("🗑️ [CLEANUP] Removed backup from history:", backupId);
  }

  /**
   * Експортує сесію (заміна для handleExportCaptionData)
   */
  static async exportSession(
    sessionId?: string,
    format: string = "json"
  ): Promise<{ success: boolean; filename?: string; error?: string }> {
    try {
      let sessionData;

      if (sessionId) {
        // Get specific session from history
        const historyResult = await this.getSessionHistory();
        if (!historyResult.success || !historyResult.data) {
          return { success: false, error: "Failed to get history" };
        }
        sessionData = historyResult.data.find(
          (session: any) => session.id === sessionId
        );
      } else {
        // Get current session
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
