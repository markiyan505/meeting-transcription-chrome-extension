/**
 * Адаптер для live-captions-saver (Microsoft Teams)
 * Адаптує функціональність live-captions-saver до універсального інтерфейсу
 */

import {
  CaptionAdapter,
  CaptionEntry,
  ChatMessage,
  MeetingInfo,
  RecordingState,
  ExportOptions,
  OperationResult,
  TeamsConfig,
} from "../types";

export class LiveCaptionsAdapter implements CaptionAdapter {
  private config: TeamsConfig;
  private eventListeners: Map<string, Function[]> = new Map();
  private isInitialized = false;
  private isRecording = false;
  private isPaused = false;
  private recordingStartTime?: string;
  private pauseStartTime?: string;
  private totalPauseDuration = 0;
  private captions: CaptionEntry[] = [];
  private chatMessages: ChatMessage[] = [];
  private meetingInfo: MeetingInfo = {
    title: "",
    startTime: "",
    attendees: [],
    platform: "teams",
  };

  // Селектори будуть братися з конфігурації
  private selectors: any;

  // Стан спостерігачів
  private observers: {
    captionObserver?: MutationObserver;
    chatObserver?: MutationObserver;
    meetingObserver?: MutationObserver;
    attendeeObserver?: MutationObserver;
  } = {};

  // Кеш елементів
  private cachedElements = new Map<
    string,
    { element: Element; timestamp: number }
  >();

  constructor(config: TeamsConfig) {
    this.config = config;
    // Встановлюємо селектори з конфігурації
    this.selectors = config.selectors;
  }

  async initialize(): Promise<OperationResult> {
    try {
      // Перевіряємо, чи ми на Microsoft Teams
      if (!this.isTeamsPage()) {
        return { success: false, error: "Not on Microsoft Teams page" };
      }

      // Налаштовуємо обробники подій
      this.setupEventHandlers();

      // Отримуємо інформацію про зустріч
      await this.updateMeetingInfo();

      this.isInitialized = true;
      this.emit("initialized", { platform: "teams" });

      return {
        success: true,
        message: "LiveCaptionsAdapter initialized successfully",
      };
    } catch (error) {
      return { success: false, error: `Failed to initialize: ${error}` };
    }
  }

  async isCaptionsEnabled(): Promise<boolean> {
    try {
      const captionsContainer = this.getCachedElement(
        this.selectors.captionsContainer
      );
      return captionsContainer !== null;
    } catch (error) {
      console.error("Error checking captions status:", error);
      return false;
    }
  }

  async isInMeeting(): Promise<boolean> {
    try {
      const leaveButton = this.getCachedElement(this.selectors.leaveButtons);
      return leaveButton !== null;
    } catch (error) {
      console.error("Error checking meeting status:", error);
      return false;
    }
  }

  async getRecordingState(): Promise<RecordingState> {
    return {
      isRecording: this.isRecording,
      isPaused: this.isPaused,
      startTime: this.recordingStartTime,
      pauseTime: this.pauseStartTime,
      totalPauseDuration: this.totalPauseDuration,
      captionCount: this.captions.length,
      chatMessageCount: this.chatMessages.length,
    };
  }

  async enableCaptions(): Promise<OperationResult> {
    try {
      if (await this.isCaptionsEnabled()) {
        return { success: true, message: "Captions already enabled" };
      }

      // Автоматичне ввімкнення субтитрів через меню
      const result = await this.attemptAutoEnableCaptions();
      if (result.success) {
        this.emit("captions_enabled", { timestamp: new Date().toISOString() });
      }
      return result;
    } catch (error) {
      return { success: false, error: `Failed to enable captions: ${error}` };
    }
  }

  async disableCaptions(): Promise<OperationResult> {
    try {
      if (!(await this.isCaptionsEnabled())) {
        return { success: true, message: "Captions already disabled" };
      }

      // Автоматичне вимкнення субтитрів через меню
      const result = await this.attemptAutoDisableCaptions();
      if (result.success) {
        this.emit("captions_disabled", { timestamp: new Date().toISOString() });
      }
      return result;
    } catch (error) {
      return { success: false, error: `Failed to disable captions: ${error}` };
    }
  }

  async startRecording(): Promise<OperationResult> {
    try {
      if (this.isRecording) {
        return { success: true, message: "Recording already started" };
      }

      if (!(await this.isCaptionsEnabled())) {
        const enableResult = await this.enableCaptions();
        if (!enableResult.success) {
          return enableResult;
        }
      }

      this.isRecording = true;
      this.isPaused = false;
      this.recordingStartTime = new Date().toISOString();
      this.totalPauseDuration = 0;

      // Очищаємо попередні дані
      this.captions = [];
      this.chatMessages = [];

      // Налаштовуємо спостерігачі
      this.setupObservers();

      this.emit("recording_started", { timestamp: this.recordingStartTime });

      return { success: true, message: "Recording started successfully" };
    } catch (error) {
      return { success: false, error: `Failed to start recording: ${error}` };
    }
  }

  async stopRecording(): Promise<OperationResult> {
    try {
      if (!this.isRecording) {
        return { success: true, message: "Recording not started" };
      }

      this.isRecording = false;
      this.isPaused = false;
      this.meetingInfo.endTime = new Date().toISOString();

      // Зупиняємо спостерігачі
      this.cleanupObservers();

      this.emit("recording_stopped", {
        timestamp: new Date().toISOString(),
        captionCount: this.captions.length,
        chatMessageCount: this.chatMessages.length,
      });

      return { success: true, message: "Recording stopped successfully" };
    } catch (error) {
      return { success: false, error: `Failed to stop recording: ${error}` };
    }
  }

  async pauseRecording(): Promise<OperationResult> {
    try {
      if (!this.isRecording || this.isPaused) {
        return { success: false, error: "Recording not active" };
      }

      this.isPaused = true;
      this.pauseStartTime = new Date().toISOString();

      this.emit("recording_paused", { timestamp: this.pauseStartTime });

      return { success: true, message: "Recording paused successfully" };
    } catch (error) {
      return { success: false, error: `Failed to pause recording: ${error}` };
    }
  }

  async resumeRecording(): Promise<OperationResult> {
    try {
      if (!this.isRecording || !this.isPaused) {
        return { success: false, error: "Recording not paused" };
      }

      if (this.pauseStartTime) {
        const pauseDuration =
          Date.now() - new Date(this.pauseStartTime).getTime();
        this.totalPauseDuration += pauseDuration;
      }

      this.isPaused = false;
      this.pauseStartTime = undefined;

      this.emit("recording_resumed", { timestamp: new Date().toISOString() });

      return { success: true, message: "Recording resumed successfully" };
    } catch (error) {
      return { success: false, error: `Failed to resume recording: ${error}` };
    }
  }

  getCaptions(): CaptionEntry[] {
    return [...this.captions];
  }

  getChatMessages(): ChatMessage[] {
    return [...this.chatMessages];
  }

  getMeetingInfo(): MeetingInfo {
    return { ...this.meetingInfo };
  }

  async exportData(options: ExportOptions): Promise<OperationResult> {
    try {
      const data = {
        meetingInfo: this.meetingInfo,
        captions: this.captions,
        chatMessages: options.includeChatMessages ? this.chatMessages : [],
        exportOptions: options,
        exportedAt: new Date().toISOString(),
      };

      let content: string;
      let filename: string;

      switch (options.format) {
        case "json":
          content = JSON.stringify(data, null, 2);
          filename =
            options.filename || `${this.meetingInfo.title}_transcript.json`;
          break;
        case "txt":
          content = this.formatAsText(data, options);
          filename =
            options.filename || `${this.meetingInfo.title}_transcript.txt`;
          break;
        case "srt":
          content = this.formatAsSRT(data, options);
          filename =
            options.filename || `${this.meetingInfo.title}_transcript.srt`;
          break;
        case "vtt":
          content = this.formatAsVTT(data, options);
          filename =
            options.filename || `${this.meetingInfo.title}_transcript.vtt`;
          break;
        case "csv":
          content = this.formatAsCSV(data, options);
          filename =
            options.filename || `${this.meetingInfo.title}_transcript.csv`;
          break;
        default:
          return {
            success: false,
            error: `Unsupported format: ${options.format}`,
          };
      }

      // Створюємо та завантажуємо файл
      this.downloadFile(content, filename);

      return { success: true, message: `Data exported as ${options.format}` };
    } catch (error) {
      return { success: false, error: `Failed to export data: ${error}` };
    }
  }

  async clearData(): Promise<OperationResult> {
    try {
      this.captions = [];
      this.chatMessages = [];
      this.meetingInfo = {
        title: "",
        startTime: "",
        attendees: [],
        platform: "teams",
      };

      this.emit("data_cleared", { timestamp: new Date().toISOString() });

      return { success: true, message: "Data cleared successfully" };
    } catch (error) {
      return { success: false, error: `Failed to clear data: ${error}` };
    }
  }

  async cleanup(): Promise<OperationResult> {
    try {
      this.cleanupObservers();
      this.eventListeners.clear();
      this.cachedElements.clear();
      this.isInitialized = false;

      return { success: true, message: "Cleanup completed successfully" };
    } catch (error) {
      return { success: false, error: `Failed to cleanup: ${error}` };
    }
  }

  on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Приватні методи

  private isTeamsPage(): boolean {
    return (
      window.location.hostname.includes("teams.microsoft.com") ||
      window.location.hostname.includes("teams.live.com")
    );
  }

  private setupEventHandlers(): void {
    // Налаштовуємо обробники подій для Teams
    this.setupMeetingDetection();
  }

  private setupMeetingDetection(): void {
    // Логіка виявлення початку/кінця зустрічі
    const checkMeetingStatus = () => {
      this.isInMeeting().then((inMeeting) => {
        if (inMeeting && !this.meetingInfo.startTime) {
          this.meetingInfo.startTime = new Date().toISOString();
          this.emit("meeting_started", {
            timestamp: this.meetingInfo.startTime,
          });
        }
      });
    };

    // Перевіряємо статус кожні 5 секунд
    setInterval(checkMeetingStatus, 5000);
    checkMeetingStatus();
  }

  private async updateMeetingInfo(): Promise<void> {
    try {
      // Отримуємо назву зустрічі
      this.meetingInfo.title = document.title;

      // Отримуємо учасників, якщо увімкнено відстеження
      if (this.config.trackAttendees) {
        await this.updateAttendees();
      }
    } catch (error) {
      console.error("Error updating meeting info:", error);
    }
  }

  private async updateAttendees(): Promise<void> {
    try {
      const attendeesContainer = this.getCachedElement(
        this.selectors.attendeesContainer
      );
      if (!attendeesContainer) return;

      const attendeeItems = attendeesContainer.querySelectorAll(
        this.selectors.attendeeItem
      );
      const currentTime = new Date().toLocaleTimeString();

      attendeeItems.forEach((item) => {
        const nameElement = item.querySelector(this.selectors.attendeeName);
        const roleElement = item.querySelector(this.selectors.attendeeRole);

        if (nameElement) {
          const name = nameElement.textContent?.trim() || "Unknown";
          const role = roleElement?.textContent?.trim() || "Attendee";

          if (!this.meetingInfo.attendees.includes(name)) {
            this.meetingInfo.attendees.push(name);
          }
        }
      });
    } catch (error) {
      console.error("Error updating attendees:", error);
    }
  }

  private async attemptAutoEnableCaptions(): Promise<OperationResult> {
    try {
      const moreButton = this.getCachedElement(this.selectors.moreButton);
      if (!moreButton) {
        return { success: false, error: "More button not found" };
      }

      // Клікаємо на кнопку "More"
      (moreButton as HTMLElement).click();
      await this.delay(400);

      const languageSpeechButton = this.getCachedElement(
        this.selectors.languageSpeechButton
      );
      if (!languageSpeechButton) {
        return {
          success: false,
          error: "Language and speech button not found",
        };
      }

      // Клікаємо на "Language and speech"
      (languageSpeechButton as HTMLElement).click();
      await this.delay(400);

      const captionsButton = this.getCachedElement(
        this.selectors.captionsButton
      );
      if (!captionsButton) {
        return { success: false, error: "Captions button not found" };
      }

      // Клікаємо на "Turn on live captions"
      (captionsButton as HTMLElement).click();
      await this.delay(400);

      return { success: true, message: "Captions enabled successfully" };
    } catch (error) {
      return {
        success: false,
        error: `Failed to auto-enable captions: ${error}`,
      };
    }
  }

  private async attemptAutoDisableCaptions(): Promise<OperationResult> {
    try {
      const moreButton = this.getCachedElement(this.selectors.moreButton);
      if (!moreButton) {
        return { success: false, error: "More button not found" };
      }

      // Клікаємо на кнопку "More"
      (moreButton as HTMLElement).click();
      await this.delay(400);

      const languageSpeechButton = this.getCachedElement(
        this.selectors.languageSpeechButton
      );
      if (!languageSpeechButton) {
        return {
          success: false,
          error: "Language and speech button not found",
        };
      }

      // Клікаємо на "Language and speech"
      (languageSpeechButton as HTMLElement).click();
      await this.delay(400);

      const captionsButton = this.getCachedElement(
        this.selectors.captionsButton
      );
      if (!captionsButton) {
        return { success: false, error: "Captions button not found" };
      }

      // Клікаємо на "Turn off live captions"
      (captionsButton as HTMLElement).click();
      await this.delay(400);

      return { success: true, message: "Captions disabled successfully" };
    } catch (error) {
      return {
        success: false,
        error: `Failed to auto-disable captions: ${error}`,
      };
    }
  }

  private setupObservers(): void {
    // Налаштовуємо спостерігачі для субтитрів, чату та учасників
    this.setupCaptionObserver();
    this.setupChatObserver();

    if (this.config.trackAttendees) {
      this.setupAttendeeObserver();
    }
  }

  private setupCaptionObserver(): void {
    const captionsContainer = this.getCachedElement(
      this.selectors.captionsContainer
    );
    if (!captionsContainer) return;

    const observer = new MutationObserver((mutations) => {
      if (this.isPaused) return;

      mutations.forEach(() => {
        this.processCaptionUpdates();
      });
    });

    observer.observe(captionsContainer, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    this.observers.captionObserver = observer;
  }

  private setupChatObserver(): void {
    const chatContainer = this.getCachedElement(this.selectors.chatContainer);
    if (!chatContainer) return;

    const observer = new MutationObserver((mutations) => {
      if (this.isPaused) return;

      mutations.forEach(() => {
        this.processChatUpdates();
      });
    });

    observer.observe(chatContainer, {
      childList: true,
      subtree: true,
    });

    this.observers.chatObserver = observer;
  }

  private setupAttendeeObserver(): void {
    const attendeesContainer = this.getCachedElement(
      this.selectors.attendeesContainer
    );
    if (!attendeesContainer) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach(() => {
        this.updateAttendees();
      });
    });

    observer.observe(attendeesContainer, {
      childList: true,
      subtree: true,
    });

    this.observers.attendeeObserver = observer;
  }

  private processCaptionUpdates(): void {
    try {
      const captionsContainer = this.getCachedElement(
        this.selectors.captionsContainer
      );
      if (!captionsContainer) return;

      const transcriptElements = captionsContainer.querySelectorAll(
        this.selectors.captionMessage
      );

      transcriptElements.forEach((element) => {
        try {
          const authorElement = element.querySelector(
            this.selectors.captionAuthor
          );
          const textElement = element.querySelector(this.selectors.captionText);

          if (!authorElement || !textElement) return;

          const speaker = authorElement.textContent?.trim() || "Unknown";
          const text = textElement.textContent?.trim() || "";

          if (text.length === 0) return;

          let captionId = element.getAttribute("data-caption-id");
          if (!captionId) {
            captionId = `caption_${Date.now()}_${Math.random()
              .toString(36)
              .substring(2, 9)}`;
            element.setAttribute("data-caption-id", captionId);
          }

          const existingIndex = this.captions.findIndex(
            (entry) => entry.id === captionId
          );

          if (existingIndex !== -1) {
            // Оновлюємо існуючий субтитр
            if (this.captions[existingIndex].text !== text) {
              this.captions[existingIndex].text = text;
              this.captions[existingIndex].timestamp = new Date().toISOString();
              this.emit("caption_updated", this.captions[existingIndex]);
            }
          } else {
            // Додаємо новий субтитр
            const newCaption: CaptionEntry = {
              id: captionId,
              speaker,
              text,
              timestamp: new Date().toISOString(),
            };
            this.captions.push(newCaption);
            this.emit("caption_added", newCaption);
          }
        } catch (error) {
          console.error("Error processing individual caption element:", error);
        }
      });
    } catch (error) {
      console.error("Error processing caption updates:", error);
    }
  }

  private processChatUpdates(): void {
    try {
      const chatContainer = this.getCachedElement(this.selectors.chatContainer);
      if (!chatContainer || chatContainer.children.length === 0) return;

      const lastMessage = chatContainer.lastChild;
      if (!lastMessage) return;

      // Логіка обробки повідомлень чату (аналогічно до оригінального live-captions-saver)
      // Тут можна додати специфічну логіку для Teams чату
    } catch (error) {
      console.error("Error processing chat updates:", error);
    }
  }

  private cleanupObservers(): void {
    Object.values(this.observers).forEach((observer) => {
      if (observer) {
        observer.disconnect();
      }
    });
    this.observers = {};
  }

  private getCachedElement(selector: string, expiry = 5000): Element | null {
    const now = Date.now();
    const cached = this.cachedElements.get(selector);

    if (
      cached &&
      now - cached.timestamp < expiry &&
      document.contains(cached.element)
    ) {
      return cached.element;
    }

    const element = document.querySelector(selector);
    if (element) {
      this.cachedElements.set(selector, { element, timestamp: now });
    }
    return element;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private formatAsText(data: any, options: ExportOptions): string {
    let content = `Meeting: ${data.meetingInfo.title}\n`;
    content += `Date: ${new Date(
      data.meetingInfo.startTime
    ).toLocaleString()}\n`;
    content += `Platform: ${data.meetingInfo.platform}\n\n`;

    if (options.includeSpeakers && options.includeTimestamps) {
      data.captions.forEach((caption: CaptionEntry) => {
        content += `[${caption.timestamp}] ${caption.speaker}: ${caption.text}\n`;
      });
    } else if (options.includeSpeakers) {
      data.captions.forEach((caption: CaptionEntry) => {
        content += `${caption.speaker}: ${caption.text}\n`;
      });
    } else {
      data.captions.forEach((caption: CaptionEntry) => {
        content += `${caption.text}\n`;
      });
    }

    return content;
  }

  private formatAsSRT(data: any, options: ExportOptions): string {
    let content = "";
    data.captions.forEach((caption: CaptionEntry, index: number) => {
      content += `${index + 1}\n`;
      content += `00:00:00,000 --> 00:00:00,000\n`;
      if (options.includeSpeakers) {
        content += `${caption.speaker}: ${caption.text}\n\n`;
      } else {
        content += `${caption.text}\n\n`;
      }
    });
    return content;
  }

  private formatAsVTT(data: any, options: ExportOptions): string {
    let content = "WEBVTT\n\n";
    data.captions.forEach((caption: CaptionEntry) => {
      content += `00:00:00.000 --> 00:00:00.000\n`;
      if (options.includeSpeakers) {
        content += `${caption.speaker}: ${caption.text}\n\n`;
      } else {
        content += `${caption.text}\n\n`;
      }
    });
    return content;
  }

  private formatAsCSV(data: any, options: ExportOptions): string {
    let content = "Timestamp,Speaker,Text\n";
    data.captions.forEach((caption: CaptionEntry) => {
      content += `"${caption.timestamp}","${
        caption.speaker
      }","${caption.text.replace(/"/g, '""')}"\n`;
    });
    return content;
  }

  private downloadFile(content: string, filename: string): void {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
