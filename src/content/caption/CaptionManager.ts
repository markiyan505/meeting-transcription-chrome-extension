/**
 * Універсальний менеджер для роботи з субтитрами
 * Надає єдиний інтерфейс для роботи з різними платформами
 */

import {
  CaptionAdapter,
  CaptionEntry,
  ChatMessage,
  MeetingInfo,
  RecordingState,
  ExportOptions,
  OperationResult,
  CaptionEvent,
  ExportFormat,
  HydrationData,
} from "./types";

export class CaptionManager {
  private adapter: CaptionAdapter | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private isInitialized = false;

  constructor() {
    this.setupEventHandling();
  }

  /**
   * Ініціалізує менеджер з вказаним адаптером
   */
  async initialize(adapter: CaptionAdapter): Promise<OperationResult> {
    try {
      this.adapter = adapter;
      const result = await adapter.initialize();

      if (result.success) {
        this.isInitialized = true;
        this.setupAdapterEvents();
        this.emit("initialized", { adapter: adapter.constructor.name });
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to initialize caption manager: ${errorMessage}`,
      };
    }
  }

  /**
   * Перевіряє, чи ввімкнені субтитри
   */
  async isCaptionsEnabled(): Promise<boolean> {
    if (!this.adapter) {
      throw new Error("Caption manager not initialized");
    }
    return await this.adapter.isCaptionsEnabled();
  }

  /**
   * Перевіряє, чи користувач знаходиться на зустрічі
   */
  async isInMeeting(): Promise<boolean> {
    if (!this.adapter) {
      throw new Error("Caption manager not initialized");
    }
    return await this.adapter.isInMeeting();
  }

  /**
   * Ввімкнює субтитри
   */
  async enableCaptions(): Promise<OperationResult> {
    if (!this.adapter) {
      return { success: false, error: "Caption manager not initialized" };
    }

    try {
      const result = await this.adapter.enableCaptions();
      // Подія captions_enabled вже емітується в LiveCaptionsAdapter.enableCaptions()
      // тому тут не потрібно дублювати
      return result;
    } catch (error) {
      return { success: false, error: `Failed to enable captions: ${error}` };
    }
  }

  /**
   * Вимкнює субтитри
   */
  async disableCaptions(): Promise<OperationResult> {
    if (!this.adapter) {
      return { success: false, error: "Caption manager not initialized" };
    }

    try {
      const result = await this.adapter.disableCaptions();
      // Подія captions_disabled вже емітується в LiveCaptionsAdapter.disableCaptions()
      // тому тут не потрібно дублювати
      return result;
    } catch (error) {
      return { success: false, error: `Failed to disable captions: ${error}` };
    }
  }

  /**
   * Перевіряє, чи працюють субтитри
   */
  async areCaptionsEnabled(): Promise<boolean> {
    if (!this.adapter) {
      return false;
    }

    try {
      return await this.adapter.isCaptionsEnabled();
    } catch (error) {
      console.error("❌ [CAPTIONS] Failed to check captions status:", error);
      return false;
    }
  }

  /**
   * Починає запис субтитрів з перевіркою субтитрів
   */
  async startRecording(): Promise<OperationResult> {
    if (!this.adapter) {
      return { success: false, error: "Caption manager not initialized" };
    }

    try {
      // Перевіряємо, чи працюють субтитри
      const captionsEnabled = await this.areCaptionsEnabled();

      if (!captionsEnabled) {
        console.log(
          "⚠️ [CAPTIONS] Captions not enabled, attempting to enable..."
        );

        // Спробуємо увімкнути субтитри
        const enableResult = await this.enableCaptions();

        if (!enableResult.success) {
          return {
            success: false,
            error: `Failed to enable captions: ${enableResult.error}`,
            warning:
              "Captions are not available. Recording may not capture subtitles.",
          };
        }

        console.log("✅ [CAPTIONS] Captions enabled successfully");

        // Затримка для того, щоб субтитри встигли завантажитися
        console.log("⏳ [CAPTIONS] Waiting for captions to load...");
        await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 секунди

        // Перевіряємо, чи субтитри дійсно працюють після затримки
        const captionsStillEnabled = await this.areCaptionsEnabled();
        if (!captionsStillEnabled) {
          console.warn(
            "⚠️ [CAPTIONS] Captions disabled after delay, but continuing..."
          );
        } else {
          console.log("✅ [CAPTIONS] Captions confirmed working after delay");
        }
      } else {
        
        console.log("✅ [CAPTIONS] Captions already enabled");

        // Невелика затримка для стабілізації навіть якщо субтитри вже увімкнені
        console.log("⏳ [CAPTIONS] Stabilizing captions...");
        await new Promise((resolve) => setTimeout(resolve, 500)); // 0.5 секунди
        console.log("✅ [CAPTIONS] Captions stabilized");
      }

      const result = await this.adapter.startRecording();
      // Подія recording_started вже емітується в BaseAdapter.startRecording()
      // тому тут не потрібно дублювати
      return result;
    } catch (error) {
      return { success: false, error: `Failed to start recording: ${error}` };
    }
  }

  /**
   * Зупиняє запис субтитрів
   */
  async stopRecording(): Promise<OperationResult> {
    if (!this.adapter) {
      return { success: false, error: "Caption manager not initialized" };
    }

    try {
      const result = await this.adapter.stopRecording();
      // Подія recording_stopped вже емітується в BaseAdapter.stopRecording()
      // тому тут не потрібно дублювати
      return result;
    } catch (error) {
      return { success: false, error: `Failed to stop recording: ${error}` };
    }
  }

  /**
   * Ставить запис на паузу
   */
  async pauseRecording(): Promise<OperationResult> {
    if (!this.adapter) {
      return { success: false, error: "Caption manager not initialized" };
    }

    try {
      const result = await this.adapter.pauseRecording();
      // Подія recording_paused вже емітується в BaseAdapter.pauseRecording()
      // тому тут не потрібно дублювати
      return result;
    } catch (error) {
      return { success: false, error: `Failed to pause recording: ${error}` };
    }
  }

  /**
   * Відновлює запис з паузи
   */
  async resumeRecording(): Promise<OperationResult> {
    if (!this.adapter) {
      return { success: false, error: "Caption manager not initialized" };
    }

    try {
      const result = await this.adapter.resumeRecording();
      // Подія recording_resumed вже емітується в BaseAdapter.resumeRecording()
      // тому тут не потрібно дублювати
      return result;
    } catch (error) {
      return { success: false, error: `Failed to resume recording: ${error}` };
    }
  }

  /**
   * Отримує поточний стан запису
   */
  async getRecordingState(): Promise<RecordingState> {
    if (!this.adapter) {
      throw new Error("Caption manager not initialized");
    }
    return await this.adapter.getRecordingState();
  }

  /**
   * Отримує всі збережені субтитри
   */
  getCaptions(): CaptionEntry[] {
    if (!this.adapter) {
      throw new Error("Caption manager not initialized");
    }
    return this.adapter.getCaptions();
  }

  /**
   * Отримує всі повідомлення чату
   */
  getChatMessages(): ChatMessage[] {
    if (!this.adapter) {
      throw new Error("Caption manager not initialized");
    }
    return this.adapter.getChatMessages();
  }

  /**
   * Отримує інформацію про зустріч
   */
  getMeetingInfo(): MeetingInfo {
    if (!this.adapter) {
      throw new Error("Caption manager not initialized");
    }
    return this.adapter.getMeetingInfo();
  }

  /**
   * Експортує дані у вказаному форматі
   */
  async exportData(
    format: ExportFormat,
    options?: Partial<ExportOptions>
  ): Promise<OperationResult> {
    if (!this.adapter) {
      return { success: false, error: "Caption manager not initialized" };
    }

    const exportOptions: ExportOptions = {
      format,
      includeTimestamps: true,
      includeSpeakers: true,
      includeChatMessages: false,
      ...options,
    };

    try {
      const result = await this.adapter.exportData(exportOptions);
      if (result.success) {
        this.emit("data_exported", { format, options: exportOptions });
      }
      return result;
    } catch (error) {
      return { success: false, error: `Failed to export data: ${error}` };
    }
  }

  /**
   * Очищає всі дані
   */
  async clearData(): Promise<OperationResult> {
    if (!this.adapter) {
      return { success: false, error: "Caption manager not initialized" };
    }

    try {
      const result = await this.adapter.clearData();
      if (result.success) {
        this.emit("data_cleared", { timestamp: new Date().toISOString() });
      }
      return result;
    } catch (error) {
      return { success: false, error: `Failed to clear data: ${error}` };
    }
  }

  /**
   * Очищає ресурси
   */
  async cleanup(): Promise<OperationResult> {
    if (!this.adapter) {
      return { success: false, error: "Caption manager not initialized" };
    }

    try {
      const result = await this.adapter.cleanup();
      this.isInitialized = false;
      this.adapter = null;
      this.emit("cleanup_completed", { timestamp: new Date().toISOString() });
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { success: false, error: `Failed to cleanup: ${errorMessage}` };
    }
  }

  /**
   * Підписується на події
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Відписується від подій
   */
  off(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Відправляє подію
   */
  private emit(event: string, data: any): void {
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

  /**
   * Налаштовує обробку подій від адаптера
   */
  private setupAdapterEvents(): void {
    if (!this.adapter) return;

    // Прокидаємо події від адаптера
    this.adapter.on("caption_added", (data) =>
      this.emit("caption_added", data)
    );
    this.adapter.on("caption_updated", (data) =>
      this.emit("caption_updated", data)
    );
    this.adapter.on("recording_started", (data) =>
      this.emit("recording_started", data)
    );
    this.adapter.on("recording_stopped", (data) =>
      this.emit("recording_stopped", data)
    );
    this.adapter.on("recording_paused", (data) =>
      this.emit("recording_paused", data)
    );
    this.adapter.on("recording_resumed", (data) =>
      this.emit("recording_resumed", data)
    );
    this.adapter.on("attendees_updated", (data) =>
      this.emit("attendees_updated", data)
    );
    this.adapter.on("meeting_started", (data) =>
      this.emit("meeting_started", data)
    );
    this.adapter.on("meeting_ended", (data) =>
      this.emit("meeting_ended", data)
    );
    this.adapter.on("error", (data) => this.emit("error", data));
  }

  /**
   * Налаштовує базову обробку подій
   */
  private setupEventHandling(): void {
    // Додаємо логування для всіх подій
    this.on("*", (data) => {
      console.log("CaptionManager event:", data);
    });
  }

  /**
   * Перевіряє, чи ініціалізований менеджер
   */
  get initialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Отримує поточний адаптер
   */
  get currentAdapter(): CaptionAdapter | null {
    return this.adapter;
  }

  /**
   * Наповнює стан менеджера даними з попередньої сесії
   */
  public hydrate(data: HydrationData): void {
    if (!this.adapter) {
      console.error("Cannot hydrate: adapter is not initialized.");
      return;
    }
    this.adapter.hydrate(data);
  }
}
