/**
 * Базовий абстрактний клас для всіх адаптерів субтитрів
 * Реалізує спільну логіку управління станом, подіями та експортом даних
 */

import {
  CaptionAdapter,
  CaptionEntry,
  ChatMessage,
  MeetingInfo,
  RecordingState,
  ExportOptions,
  OperationResult,
  AdapterConfig,
  HydrationData,
} from "../types";
import {
  formatAsText,
  formatAsSRT,
  formatAsVTT,
  formatAsCSV,
} from "../formatting";

export abstract class BaseAdapter implements CaptionAdapter {
  protected config: AdapterConfig;
  protected eventListeners: Map<string, Function[]> = new Map();
  protected isInitialized = false;
  protected isRecording = false;
  protected isPaused = false;
  protected recordingStartTime?: string;
  protected pauseStartTime?: string;
  protected totalPauseDuration = 0;
  protected captions: CaptionEntry[] = [];
  protected chatMessages: ChatMessage[] = [];
  protected meetingInfo: MeetingInfo = {
    title: "",
    startTime: "",
    attendees: [],
    platform: "unknown",
  };

  private meetingStateObserver: MutationObserver | null = null;
  protected wasInMeeting = false;
  private meetingStateDebounceTimer: NodeJS.Timeout | null = null;

  constructor(config: AdapterConfig) {
    this.config = config;
    this.meetingInfo.platform = config.platform as any;
  }

  // Абстрактні методи, які повинні бути реалізовані в дочірніх класах
  abstract initialize(): Promise<OperationResult>;
  abstract isCaptionsEnabled(): Promise<boolean>;
  abstract isInMeeting(): Promise<boolean>;
  abstract enableCaptions(): Promise<OperationResult>;
  abstract disableCaptions(): Promise<OperationResult>;
  
  // Абстрактні методи для управління спостерігачами
  protected abstract setupPlatformObservers(): void;
  protected abstract cleanupPlatformObservers(): void;

  protected setupMeetingStateObserver(): void {
    if (this.meetingStateObserver) return;

    this.meetingStateObserver = new MutationObserver(() => {
      if (this.meetingStateDebounceTimer) {
        clearTimeout(this.meetingStateDebounceTimer);
      }
      this.meetingStateDebounceTimer = setTimeout(() => this.handleMeetingStateChange(), 1000);
    });

    this.meetingStateObserver.observe(document.body, { childList: true, subtree: true });
    // Первинна перевірка стану
    this.handleMeetingStateChange();
  }

  private async handleMeetingStateChange(): Promise<void> {
    const nowInMeeting = await this.isInMeeting();
    
    if (this.wasInMeeting !== nowInMeeting) {
      console.log(`Meeting state changed: ${this.wasInMeeting} -> ${nowInMeeting}`);
      if (nowInMeeting) {
        // Увійшли в зустріч
        this.meetingInfo.startTime = new Date().toISOString();
        this.emit("meeting_started", { timestamp: this.meetingInfo.startTime });
      } else {
        // Вийшли з зустрічі
        this.emit("meeting_ended", { timestamp: new Date().toISOString() });
      }
      this.wasInMeeting = nowInMeeting;
    }
  }

  async cleanup(): Promise<OperationResult> {
    this.cleanupPlatformObservers();
    if (this.meetingStateObserver) {
      this.meetingStateObserver.disconnect();
      this.meetingStateObserver = null;
    }
    if(this.meetingStateDebounceTimer) {
      clearTimeout(this.meetingStateDebounceTimer);
    }
    this.eventListeners.clear();
    this.isInitialized = false;
    return { success: true, message: "Cleanup completed successfully" };
  }

  hydrate(data: HydrationData): void {
    this.captions = data.captions || [];
    this.chatMessages = data.chatMessages || [];
    this.meetingInfo = data.meetingInfo || this.meetingInfo;
    console.log("Adapter state hydrated from previous session.");
    this.emit("hydrated", { captionCount: this.captions.length });
  }

  // Реалізація спільних методів
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

  async startRecording(): Promise<OperationResult> {
    if (this.isRecording) {
      return { success: true, message: "Recording already started" };
    }

    this.isRecording = true;
    this.isPaused = false;
    this.recordingStartTime = new Date().toISOString();
    this.totalPauseDuration = 0;

    this.clearDataInternal();
    this.setupPlatformObservers();

    this.emit("recording_started", { timestamp: this.recordingStartTime });
    return { success: true, message: "Recording started successfully" };
  }

  async stopRecording(): Promise<OperationResult> {
    if (!this.isRecording) {
      return { success: true, message: "Recording not started" };
    }

    this.isRecording = false;
    this.isPaused = false;
    this.meetingInfo.endTime = new Date().toISOString();

    this.cleanupPlatformObservers();

    this.emit("recording_stopped", {
      timestamp: this.meetingInfo.endTime,
      captionCount: this.captions.length,
      chatMessageCount: this.chatMessages.length,
    });

    return { success: true, message: "Recording stopped successfully" };
  }

  async pauseRecording(): Promise<OperationResult> {
    if (!this.isRecording || this.isPaused) {
      return { success: false, error: "Recording not active" };
    }

    this.isPaused = true;
    this.pauseStartTime = new Date().toISOString();

    this.emit("recording_paused", { timestamp: this.pauseStartTime });
    return { success: true, message: "Recording paused successfully" };
  }

  async resumeRecording(): Promise<OperationResult> {
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
      };

      let content: string;
      let filename: string;
      const title = this.meetingInfo.title || "meeting";

      switch (options.format) {
        case "json":
          content = JSON.stringify(
            {
              ...data,
              exportOptions: options,
              exportedAt: new Date().toISOString(),
            },
            null,
            2
          );
          filename = options.filename || `${title}_transcript.json`;
          break;
        case "txt":
          content = formatAsText(data, options);
          filename = options.filename || `${title}_transcript.txt`;
          break;
        case "srt":
          content = formatAsSRT(data.captions, options);
          filename = options.filename || `${title}_transcript.srt`;
          break;
        case "vtt":
          content = formatAsVTT(data.captions, options);
          filename = options.filename || `${title}_transcript.vtt`;
          break;
        case "csv":
          content = formatAsCSV(data.captions, options);
          filename = options.filename || `${title}_transcript.csv`;
          break;
        default:
          return {
            success: false,
            error: `Unsupported format: ${options.format}`,
          };
      }

      this.downloadFile(content, filename);
      return { success: true, message: `Data exported as ${options.format}` };
    } catch (error) {
      return { success: false, error: `Failed to export data: ${error}` };
    }
  }

  async clearData(): Promise<OperationResult> {
    this.clearDataInternal();
    this.emit("data_cleared", { timestamp: new Date().toISOString() });
    return { success: true, message: "Data cleared successfully" };
  }

  private clearDataInternal(): void {
    this.captions = [];
    this.chatMessages = [];
    this.meetingInfo = {
      ...this.meetingInfo,
      startTime: "",
      endTime: undefined,
      attendees: [],
    };
  }

  private downloadFile(content: string, filename: string): void {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Система подій
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
}
