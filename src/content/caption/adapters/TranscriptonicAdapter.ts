/**
 * Адаптер для transcriptonic (Google Meet)
 * Адаптує функціональність transcriptonic до універсального інтерфейсу
 */

import {
  CaptionAdapter,
  CaptionEntry,
  ChatMessage,
  MeetingInfo,
  RecordingState,
  ExportOptions,
  OperationResult,
  GoogleMeetConfig,
} from "../types";

export class TranscriptonicAdapter implements CaptionAdapter {
  private config: GoogleMeetConfig;
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
    platform: "google-meet",
  };

  // Buffer variables to avoid duplicate captions (inspired by Transcriptonic)
  private personNameBuffer: string = "";
  private transcriptTextBuffer: string = "";
  private timestampBuffer: string = "";

  // Версія UI Google Meet
  private uiType: 1 | 2;

  // Базові селектори будуть братися з конфігурації

  // Динамічні селектори, які змінюються залежно від версії UI
  private selectors: any;

  constructor(config: GoogleMeetConfig) {
    this.config = config;
    // Визначаємо версію UI Google Meet при створенні адаптера
    this.uiType = this.detectUIType();
    // Налаштовуємо селектори відповідно до версії UI
    this.selectors = this.getSelectorsForUIType(this.uiType);
  }

  async initialize(): Promise<OperationResult> {
    try {
      // Перевіряємо, чи ми на Google Meet
      if (!this.isGoogleMeetPage()) {
        return { success: false, error: "Not on Google Meet page" };
      }

      // Налаштовуємо обробники подій
      this.setupEventHandlers();

      // Отримуємо інформацію про зустріч
      await this.updateMeetingInfo();

      this.isInitialized = true;
      this.emit("initialized", { platform: "google-meet" });

      return {
        success: true,
        message: "TranscriptonicAdapter initialized successfully",
      };
    } catch (error) {
      return { success: false, error: `Failed to initialize: ${error}` };
    }
  }

  async isCaptionsEnabled(): Promise<boolean> {
    try {
      console.log(
        "🔍 [TranscriptonicAdapter] Checking if captions are enabled..."
      );
      console.log(
        "🔍 [TranscriptonicAdapter] Using selector:",
        this.selectors.captionsContainer
      );

      const captionsContainer = document.querySelector(
        this.selectors.captionsContainer
      );

      const isEnabled = captionsContainer !== null;
      console.log("📊 [TranscriptonicAdapter] Captions enabled:", isEnabled);

      if (captionsContainer) {
        console.log(
          "✅ [TranscriptonicAdapter] Captions container found:",
          captionsContainer
        );
        console.log(
          "📊 [TranscriptonicAdapter] Container children:",
          captionsContainer.children.length
        );
        console.log(
          "📊 [TranscriptonicAdapter] Container innerHTML length:",
          captionsContainer.innerHTML.length
        );
      } else {
        console.log("❌ [TranscriptonicAdapter] Captions container not found");

        // Спробуємо знайти альтернативні селектори
        const alternativeSelectors = [
          '[role="region"][tabindex="0"]',
          '[data-tid*="caption"]',
          '[aria-live="polite"]',
          ".captions",
          "#captions",
          '[class*="caption"]',
        ];

        for (const selector of alternativeSelectors) {
          const altContainer = document.querySelector(selector);
          if (altContainer) {
            console.log(
              "✅ [TranscriptonicAdapter] Found alternative container:",
              selector,
              altContainer
            );
          }
        }
      }

      return isEnabled;
    } catch (error) {
      console.error(
        "❌ [TranscriptonicAdapter] Error checking captions status:",
        error
      );
      return false;
    }
  }

  async isInMeeting(): Promise<boolean> {
    try {
      const leaveButton = this.selectElements(
        this.selectors.leaveButton,
        this.selectors.leaveButtonText
      )[0];
      return leaveButton !== undefined;
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
      console.log("🔍 [TranscriptonicAdapter] Enabling captions...");

      if (await this.isCaptionsEnabled()) {
        console.log("✅ [TranscriptonicAdapter] Captions already enabled");
        return { success: true, message: "Captions already enabled" };
      }

      console.log("🔍 [TranscriptonicAdapter] Looking for captions button...");
      console.log(
        "🔍 [TranscriptonicAdapter] Button selector:",
        this.selectors.captionsButton
      );
      console.log(
        "🔍 [TranscriptonicAdapter] Button text:",
        this.selectors.captionsButtonText
      );

      const captionsButton = this.selectElements(
        this.selectors.captionsButton,
        this.selectors.captionsButtonText
      )[0];

      if (!captionsButton) {
        console.log("❌ [TranscriptonicAdapter] Captions button not found");

        // Спробуємо знайти альтернативні кнопки
        const alternativeButtons = [
          'button[aria-label*="caption"]',
          'button[aria-label*="subtitle"]',
          'button[title*="caption"]',
          'button[title*="subtitle"]',
          ".google-symbols",
          '[data-tid*="caption"]',
        ];

        for (const selector of alternativeButtons) {
          const altButton = document.querySelector(selector);
          if (altButton) {
            console.log(
              "✅ [TranscriptonicAdapter] Found alternative button:",
              selector,
              altButton
            );
          }
        }

        return { success: false, error: "Captions button not found" };
      }

      console.log(
        "✅ [TranscriptonicAdapter] Captions button found:",
        captionsButton
      );
      console.log("🖱️ [TranscriptonicAdapter] Clicking captions button...");

      (captionsButton as HTMLElement).click();
      this.emit("captions_enabled", { timestamp: new Date().toISOString() });

      console.log("✅ [TranscriptonicAdapter] Captions enabled successfully");
      return { success: true, message: "Captions enabled successfully" };
    } catch (error) {
      console.error(
        "❌ [TranscriptonicAdapter] Failed to enable captions:",
        error
      );
      return { success: false, error: `Failed to enable captions: ${error}` };
    }
  }

  async disableCaptions(): Promise<OperationResult> {
    try {
      if (!(await this.isCaptionsEnabled())) {
        return { success: true, message: "Captions already disabled" };
      }

      const captionsButton = this.selectElements(
        this.selectors.captionsButton,
        this.selectors.captionsButtonText
      )[0];
      if (!captionsButton) {
        return { success: false, error: "Captions button not found" };
      }

      (captionsButton as HTMLElement).click();
      this.emit("captions_disabled", { timestamp: new Date().toISOString() });

      return { success: true, message: "Captions disabled successfully" };
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

      // Push any data in the buffer variables to the captions array before stopping
      if (this.personNameBuffer !== "" && this.transcriptTextBuffer !== "") {
        console.log(
          "📝 [TranscriptonicAdapter] Pushing final buffer before stopping"
        );
        this.pushBufferToCaptions();
      }

      // Clear buffers
      this.personNameBuffer = "";
      this.transcriptTextBuffer = "";
      this.timestampBuffer = "";

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

      // Push any data in the buffer variables to the captions array before pausing
      if (this.personNameBuffer !== "" && this.transcriptTextBuffer !== "") {
        console.log("📝 [TranscriptonicAdapter] Pushing buffer before pausing");
        this.pushBufferToCaptions();
      }

      // Clear buffers
      this.personNameBuffer = "";
      this.transcriptTextBuffer = "";
      this.timestampBuffer = "";

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
        platform: "google-meet",
      };

      // Clear buffers
      this.personNameBuffer = "";
      this.transcriptTextBuffer = "";
      this.timestampBuffer = "";

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

  private isGoogleMeetPage(): boolean {
    return window.location.hostname.includes("meet.google.com");
  }

  /**
   * Визначає версію UI Google Meet
   * Версія 2 - поточна версія (після липня/серпня 2024)
   * Версія 1 - стара версія
   */
  private detectUIType(): 1 | 2 {
    // Перевіряємо кілька індикаторів для більш точного визначення
    const newUIIndicators = [
      document.querySelector(".google-symbols") !== null,
      document.querySelector("[data-tid*='new-ui']") !== null,
      document.querySelector(".new-google-meet") !== null,
    ];

    const oldUIIndicators = [
      document.querySelector(".material-icons-extended") !== null,
      document.querySelector(".old-google-meet") !== null,
    ];

    // Підраховуємо кількість знайдених індикаторів
    const newUICount = newUIIndicators.filter(Boolean).length;
    const oldUICount = oldUIIndicators.filter(Boolean).length;

    // Якщо знайдено індикатори нової версії, використовуємо версію 2
    if (newUICount > 0) {
      console.log(
        `🔍 [TranscriptonicAdapter] Detected Google Meet UI version 2 (new UI)`
      );
      return 2;
    }

    // Якщо знайдено індикатори старої версії, використовуємо версію 1
    if (oldUICount > 0) {
      console.log(
        `🔍 [TranscriptonicAdapter] Detected Google Meet UI version 1 (old UI)`
      );
      return 1;
    }

    // За замовчуванням використовуємо версію 2 (поточна)
    console.log(
      `🔍 [TranscriptonicAdapter] Using default Google Meet UI version 2`
    );
    return 2;
  }

  /**
   * Отримує селектори для конкретної версії UI з конфігурації
   */
  private getSelectorsForUIType(uiType: 1 | 2): any {
    // Отримуємо селектори з конфігурації
    const uiVersions = this.config.uiVersions;
    const baseSelectors = this.config.baseSelectors;

    // Об'єднуємо базові селектори з селекторами конкретної версії UI
    return {
      ...baseSelectors,
      ...uiVersions[uiType],
    };
  }

  private setupEventHandlers(): void {
    // Налаштовуємо обробники подій для Google Meet
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
      const titleElement = document.querySelector(this.selectors.meetingTitle);
      if (titleElement) {
        this.meetingInfo.title = titleElement.textContent || document.title;
      } else {
        this.meetingInfo.title = document.title;
      }

      // Отримуємо ім'я користувача
      const userNameElement = document.querySelector(this.selectors.userName);
      if (userNameElement) {
        const userName = userNameElement.textContent;
        if (userName && !this.meetingInfo.attendees.includes(userName)) {
          this.meetingInfo.attendees.push(userName);
        }
      }
    } catch (error) {
      console.error("Error updating meeting info:", error);
    }
  }

  private setupObservers(): void {
    // Налаштовуємо спостерігачі для субтитрів та чату
    this.setupCaptionObserver();
    this.setupChatObserver();
  }

  private setupCaptionObserver(): void {
    console.log("🔍 [TranscriptonicAdapter] Setting up caption observer...");
    console.log(
      "🔍 [TranscriptonicAdapter] Looking for container with selector:",
      this.selectors.captionsContainer
    );

    const captionsContainer = document.querySelector(
      this.selectors.captionsContainer
    );

    if (!captionsContainer) {
      console.log(
        "❌ [TranscriptonicAdapter] Captions container not found, cannot setup observer"
      );

      // Спробуємо знайти альтернативні селектори
      const alternativeSelectors = [
        '[role="region"][tabindex="0"]',
        '[data-tid*="caption"]',
        '[aria-live="polite"]',
        ".captions",
        "#captions",
        '[class*="caption"]',
      ];

      for (const selector of alternativeSelectors) {
        const altContainer = document.querySelector(selector);
        if (altContainer) {
          console.log(
            "✅ [TranscriptonicAdapter] Found alternative container for observer:",
            selector,
            altContainer
          );
          // Оновлюємо селектор
          this.selectors.captionsContainer = selector;
          break;
        }
      }

      return;
    }

    console.log(
      "✅ [TranscriptonicAdapter] Captions container found for observer:",
      captionsContainer
    );

    const observer = new MutationObserver((mutations) => {
      if (this.isPaused) {
        console.log(
          "⏸️ [TranscriptonicAdapter] Observer paused, skipping mutations"
        );
        return;
      }

      console.log(
        "🔄 [TranscriptonicAdapter] Observer detected mutations:",
        mutations.length
      );
      mutations.forEach((mutation, index) => {
        console.log(`🔄 [TranscriptonicAdapter] Mutation ${index + 1}:`, {
          type: mutation.type,
          target: mutation.target,
          addedNodes: mutation.addedNodes.length,
          removedNodes: mutation.removedNodes.length,
        });
        this.processCaptionUpdates();
      });
    });

    observer.observe(captionsContainer, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    console.log("✅ [TranscriptonicAdapter] Caption observer setup complete");
    (this as any).captionObserver = observer;
  }

  private setupChatObserver(): void {
    const chatContainer = document.querySelector(this.selectors.chatContainer);
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

    (this as any).chatObserver = observer;
  }

  private processCaptionUpdates(): void {
    try {
      console.log("🔍 [TranscriptonicAdapter] Processing caption updates...");

      const captionsContainer = document.querySelector(
        this.selectors.captionsContainer
      );

      if (!captionsContainer) {
        console.log(
          "❌ [TranscriptonicAdapter] Captions container not found with selector:",
          this.selectors.captionsContainer
        );

        // Спробуємо знайти альтернативні селектори
        const alternativeSelectors = [
          '[role="region"][tabindex="0"]',
          '[data-tid*="caption"]',
          '[aria-live="polite"]',
          ".captions",
          "#captions",
          '[class*="caption"]',
        ];

        for (const selector of alternativeSelectors) {
          const altContainer = document.querySelector(selector);
          if (altContainer) {
            console.log(
              "✅ [TranscriptonicAdapter] Found alternative container:",
              selector,
              altContainer
            );
            break;
          }
        }

        return;
      }

      console.log(
        "✅ [TranscriptonicAdapter] Captions container found:",
        captionsContainer
      );

      const people = captionsContainer.children;
      console.log(
        "📊 [TranscriptonicAdapter] Container children count:",
        people.length
      );

      if (people.length <= 1) {
        console.log(
          "⚠️ [TranscriptonicAdapter] Not enough children in container"
        );
        // No transcript yet or the last person stopped speaking
        // Push data in the buffer variables to the captions array, but avoid pushing blank ones
        if (this.personNameBuffer !== "" && this.transcriptTextBuffer !== "") {
          console.log(
            "📝 [TranscriptonicAdapter] Pushing final buffer before stopping"
          );
          this.pushBufferToCaptions();
        }
        // Update buffers for the next person in the next mutation
        this.personNameBuffer = "";
        this.transcriptTextBuffer = "";
        return;
      }

      // Отримуємо останнього спікера
      const lastPerson = people[people.length - 2];
      const speakerElement = lastPerson.childNodes[0];
      const textElement = lastPerson.childNodes[1];

      console.log(
        "🔍 [TranscriptonicAdapter] Last person element:",
        lastPerson
      );
      console.log(
        "🔍 [TranscriptonicAdapter] Speaker element:",
        speakerElement
      );
      console.log("🔍 [TranscriptonicAdapter] Text element:", textElement);

      if (speakerElement && textElement) {
        const currentPersonName = speakerElement.textContent || "Unknown";
        const currentTranscriptText = textElement.textContent || "";

        console.log("📝 [TranscriptonicAdapter] Extracted data:", {
          speaker: currentPersonName,
          text: currentTranscriptText,
          textLength: currentTranscriptText.length,
        });

        if (currentPersonName && currentTranscriptText) {
          // Starting fresh in a meeting or resume from no active transcript
          if (this.transcriptTextBuffer === "") {
            this.personNameBuffer = currentPersonName;
            this.timestampBuffer = new Date().toISOString();
            this.transcriptTextBuffer = currentTranscriptText;
            console.log(
              "🆕 [TranscriptonicAdapter] Starting fresh transcript buffer"
            );
          }
          // Some prior transcript buffer exists
          else {
            // New person started speaking
            if (this.personNameBuffer !== currentPersonName) {
              console.log(
                "👤 [TranscriptonicAdapter] New person started speaking, pushing previous buffer"
              );
              // Push previous person's transcript as a block
              this.pushBufferToCaptions();

              // Update buffers for next mutation and store transcript block timestamp
              this.personNameBuffer = currentPersonName;
              this.timestampBuffer = new Date().toISOString();
              this.transcriptTextBuffer = currentTranscriptText;
            }
            // Same person speaking more
            else {
              console.log(
                "🔄 [TranscriptonicAdapter] Same person speaking more"
              );

              // When the same person speaks for more than 30 min (approx), Meet drops very long transcript for current person and starts over
              // This is detected by current transcript string being significantly smaller than the previous one
              if (
                currentTranscriptText.length -
                  this.transcriptTextBuffer.length <
                -250
              ) {
                console.log(
                  "📝 [TranscriptonicAdapter] Long transcript detected, pushing buffer"
                );
                // Push the long transcript
                this.pushBufferToCaptions();

                // Store transcript block timestamp for next transcript block of same person
                this.timestampBuffer = new Date().toISOString();
              }

              // Update buffers for next mutation. This has to be done irrespective of any condition.
              this.transcriptTextBuffer = currentTranscriptText;
            }
          }
        }
      } else {
        console.log(
          "❌ [TranscriptonicAdapter] Speaker or text element not found"
        );
      }
    } catch (error) {
      console.error(
        "❌ [TranscriptonicAdapter] Error processing caption updates:",
        error
      );
    }
  }

  // Pushes data in the buffer to captions array as a caption block (inspired by Transcriptonic)
  private pushBufferToCaptions(): void {
    if (this.personNameBuffer !== "" && this.transcriptTextBuffer !== "") {
      const caption: CaptionEntry = {
        id: `caption_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 9)}`,
        speaker: this.personNameBuffer,
        text: this.transcriptTextBuffer,
        timestamp: this.timestampBuffer,
      };

      console.log("📝 [TranscriptonicAdapter] Pushing buffer to captions:", {
        speaker: caption.speaker,
        textLength: caption.text.length,
        timestamp: caption.timestamp,
      });

      this.captions.push(caption);
      this.emit("caption_added", caption);
    }
  }

  private processChatUpdates(): void {
    try {
      const chatContainer = document.querySelector(
        this.selectors.chatContainer
      );
      if (!chatContainer || chatContainer.children.length === 0) return;

      const lastMessage = chatContainer.lastChild;
      if (!lastMessage) return;

      const speakerElement = lastMessage.firstChild?.firstChild;
      const messageElement = lastMessage.lastChild?.lastChild;

      if (speakerElement && messageElement) {
        const speaker = speakerElement.textContent || "Unknown";
        const message = messageElement.textContent || "";

        if (message.trim()) {
          const chatMessage: ChatMessage = {
            id: `chat_${Date.now()}_${Math.random()
              .toString(36)
              .substring(2, 9)}`,
            speaker,
            message,
            timestamp: new Date().toISOString(),
          };

          // Перевіряємо, чи це нове повідомлення
          const isNew = !this.chatMessages.some(
            (cm) => cm.speaker === speaker && cm.message === message
          );

          if (isNew) {
            this.chatMessages.push(chatMessage);
            this.emit("chat_message_added", chatMessage);
          }
        }
      }
    } catch (error) {
      console.error("Error processing chat updates:", error);
    }
  }

  private cleanupObservers(): void {
    if ((this as any).captionObserver) {
      (this as any).captionObserver.disconnect();
      (this as any).captionObserver = null;
    }
    if ((this as any).chatObserver) {
      (this as any).chatObserver.disconnect();
      (this as any).chatObserver = null;
    }
  }

  private selectElements(selector: string, text: string): Element[] {
    const elements = document.querySelectorAll(selector);
    return Array.prototype.filter.call(elements, (element: Element) => {
      return RegExp(text).test(element.textContent || "");
    });
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
