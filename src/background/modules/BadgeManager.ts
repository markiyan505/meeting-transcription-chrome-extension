/**
 * BadgeManager - управління бейджем розширення
 */

export class BadgeManager {
  /**
   * Оновлює статус бейджа для запису
   */
  static updateRecordingStatus(
    tabId: number | undefined,
    isRecording: boolean
  ): void {
    if (!tabId) return;

    chrome.action.setBadgeText({
      text: isRecording ? "REC" : "",
      tabId: tabId,
    });

    chrome.action.setBadgeBackgroundColor({
      color: isRecording ? "#f59e0b" : "#10b981",
      tabId: tabId,
    });
  }

  /**
   * Оновлює статус бейджа для стану розширення
   */
  static updateExtensionStatus(
    tabId: number | undefined,
    isActive: boolean
  ): void {
    if (!tabId) return;

    chrome.action.setBadgeText({
      text: isActive ? "ON" : "OFF",
      tabId: tabId,
    });

    chrome.action.setBadgeBackgroundColor({
      color: isActive ? "#10b981" : "#ef4444",
      tabId: tabId,
    });
  }

  /**
   * Очищає бейдж
   */
  static clearBadge(tabId: number | undefined): void {
    if (!tabId) return;

    chrome.action.setBadgeText({
      text: "",
      tabId: tabId,
    });
  }
}
