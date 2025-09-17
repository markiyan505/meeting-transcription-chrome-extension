/**
 * Базовий абстрактний клас для всіх адаптерів субтитрів
 * Реалізує спільну логіку управління станом, подіями та експортом даних
 */

import {
  CaptionAdapter,
  CaptionEntry,
  ChatMessage,
  MeetingInfo,
  SessionData,
  OperationResult,
  AdapterConfig,
} from "../types";

import type { AttendeeEvent } from "@/types/session";
import type { MeetingMetadata } from "@/types/messages";
import { ErrorHandler } from "../utils/originalUtils";

export abstract class BaseAdapter implements CaptionAdapter {
  protected config: AdapterConfig;

  protected eventListeners: Map<string, Function[]> = new Map();
  protected isInitialized = false;
  protected isRecording = false;
  protected isPaused = false;

  protected captions: CaptionEntry[] = [];
  protected chatMessages: ChatMessage[] = [];
  protected attendeeEvents: AttendeeEvent[] = [];
  protected meetingInfo: MeetingMetadata = {};

  protected TIMING = {
    BUTTON_CLICK_DELAY: 400,
    RETRY_DELAY: 2000,
    DEBOUNCE_RATE: 1000,
    ATTENDEE_UPDATE_INTERVAL: 60000,
  };

  private lastActionTimestamps = new Map<string, number>();
  private meetingStateObserver: MutationObserver | null = null;
  protected wasInMeeting = false;
  private meetingStateDebounceTimer: NodeJS.Timeout | null = null;
  protected cachedElements = new Map<
    string,
    { element: Element; timestamp: number }
  >();

  constructor(config: AdapterConfig) {
    this.config = config;
    this.meetingInfo.platform = config.platform as any;
  }

  protected getCachedElement(selector: string, expiry = 5000): Element | null {
    const now = Date.now();
    const cached = this.cachedElements.get(selector);

    if (
      cached &&
      now - cached.timestamp < expiry &&
      document.body.contains(cached.element)
    ) {
      return cached.element;
    }

    const element = document.querySelector(selector);
    if (element) {
      this.cachedElements.set(selector, { element, timestamp: now });
    } else {
      this.cachedElements.delete(selector);
    }
    return element;
  }

  getMeetingInfo(): MeetingInfo {
    return {
      ...this.meetingInfo,
      url: window.location.href,
      title: this.meetingInfo.title || "Untitled Meeting",
      startTime: this.meetingInfo.startTime || new Date().toISOString(),
      attendees: this.meetingInfo.attendees || [],
      platform: this.meetingInfo.platform || "unknown",
    };
  }

  protected isActionDebounced(actionName: string, rate?: number): boolean {
    const now = Date.now();
    const lastAttempt = this.lastActionTimestamps.get(actionName) || 0;
    const debounceRate = rate || this.TIMING.DEBOUNCE_RATE;

    if (now - lastAttempt < debounceRate) {
      console.warn(`[BaseAdapter] Action "${actionName}" is debounced.`);
      return true;
    }

    this.lastActionTimestamps.set(actionName, now);
    return false;
  }

  protected safeWrap<T extends (...args: any[]) => any>(
    fn: T,
    context: string
  ): T {
    return ErrorHandler.wrap(fn, context);
  }

  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  abstract initialize(): Promise<OperationResult>;
  abstract isCaptionsEnabled(): Promise<boolean>;
  abstract isInMeeting(): Promise<boolean>;
  abstract enableCaptions(): Promise<OperationResult>;
  abstract disableCaptions(): Promise<OperationResult>;

  protected abstract setupPlatformObservers(): void;
  protected abstract cleanupPlatformObservers(): void;

  protected setupMeetingStateObserver(): void {
    if (this.meetingStateObserver) return;

    this.meetingStateObserver = new MutationObserver(() => {
      if (this.meetingStateDebounceTimer) {
        clearTimeout(this.meetingStateDebounceTimer);
      }
      this.meetingStateDebounceTimer = setTimeout(
        () => this.handleMeetingStateChange(),
        1000
      );
    });

    this.meetingStateObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
    this.handleMeetingStateChange();
  }

  private async handleMeetingStateChange(): Promise<void> {
    const nowInMeeting = await this.isInMeeting();

    if (this.wasInMeeting !== nowInMeeting) {
      if (nowInMeeting) {
        this.emit("meeting_started", { timestamp: this.meetingInfo.startTime });
      } else {
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
    if (this.meetingStateDebounceTimer) {
      clearTimeout(this.meetingStateDebounceTimer);
    }
    this.eventListeners.clear();
    this.isInitialized = false;
    return { success: true, message: "Cleanup completed successfully" };
  }

  // hydrate(data: Pick<SessionState, 'captions' | 'chatMessages' | 'metadata'>): void {
  //   this.captions = data.captions || [];
  //   this.chatMessages = data.chatMessages || [];
  //   this.meetingInfo = data.metadata || this.meetingInfo;
  //   this.emit("hydrated", { captionCount: this.captions.length });
  // }

  hydrate(data: SessionData): void {
    this.captions = data.captions || [];
    this.chatMessages = data.chatMessages || [];
    this.attendeeEvents = data.attendeeEvents || [];
    this.meetingInfo = data.meetingInfo || this.meetingInfo;
    this.emit("hydrated", { captionCount: this.captions.length });
  }


  async startRecording(): Promise<OperationResult> {
    if (this.isRecording) {
      return { success: true, message: "Recording already started" };
    }

    try {
      const captionsEnabled = await this.isCaptionsEnabled();
      if (!captionsEnabled) {
        const enableResult = await this.enableCaptions();
        if (!enableResult.success) {
          return {
            success: false,
            error: `[CAPTIONS] Failed to enable captions: ${enableResult.error}`,
          };
        }

        await new Promise((resolve) => setTimeout(resolve, 500));

        const finalCheck = await this.isCaptionsEnabled();
        if (!finalCheck) {
          console.error(
            "[CAPTIONS] Final check failed. Captions are not enabled."
          );
          return {
            success: false,
            error: "Subtitles could not be activated.",
          };
        }
      }

      this.isRecording = true;
      this.isPaused = false;

      this.clearDataInternal();
      this.setupPlatformObservers();

      this.emit("recording_started", {});
      return { success: true, message: "Recording started successfully" };
    } catch (error) {
      return { success: false, error: `Failed to start recording: ${error}` };
    }
  }

  async stopRecording(): Promise<OperationResult> {
    if (!this.isRecording) {
      return { success: true, message: "Recording not started" };
    }

    this.isRecording = false;
    this.isPaused = false;

    this.cleanupPlatformObservers();

    this.emit("recording_stopped", {});

    return { success: true, message: "Recording stopped successfully" };
  }

  async hardStopRecording(): Promise<OperationResult> {
    if (!this.isRecording) {
      return { success: true, message: "Recording not started" };
    }

    this.isRecording = false;
    this.isPaused = false;

    this.cleanupPlatformObservers();

    this.emit("recording_hard_stopped", {});

    this.clearDataInternal();

    return { success: true, message: "Recording hard stopped successfully" };
  }

  async pauseRecording(): Promise<OperationResult> {
    if (!this.isRecording || this.isPaused) {
      return { success: false, error: "Recording not active" };
    }

    this.isPaused = true;

    this.emit("recording_paused", {});
    return { success: true, message: "Recording paused successfully" };
  }

  async resumeRecording(): Promise<OperationResult> {
    if (!this.isRecording || !this.isPaused) {
      return { success: false, error: "Recording not paused" };
    }

    this.isPaused = false;

    this.emit("recording_resumed", { timestamp: new Date().toISOString() });
    return { success: true, message: "Recording resumed successfully" };
  }

  getCaptions(): CaptionEntry[] {
    return [...this.captions];
  }

  getChatMessages(): ChatMessage[] {
    return [...this.chatMessages];
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
      attendees: [],
    };
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
}
