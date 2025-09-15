/**
 * Універсальні типи для модуля зчитування субтитрів
 */

import type {
  CaptionEntry,
  ChatMessage,
  MeetingInfo,
  HydrationData,
  SessionData,
  RecordingState,
  ExportFormat,
  ExportOptions,
  OperationResult,
} from "../../types/session";

// Re-export types for backward compatibility
export type {
  CaptionEntry,
  ChatMessage,
  MeetingInfo,
  HydrationData,
  SessionData,
  RecordingState,
  ExportFormat,
  ExportOptions,
  OperationResult,
};

// Конфігурація адаптера
export interface AdapterConfig {
  platform: string;
  autoEnableCaptions: boolean;
  autoSaveOnEnd: boolean;
  trackAttendees: boolean;
  operationMode: "manual" | "automatic";
}

// Події
export interface CaptionEvent {
  type:
    | "caption_added"
    | "caption_updated"
    | "recording_started"
    | "recording_stopped"
    | "recording_paused"
    | "recording_resumed"
    | "hydrated"
    | "error";
  data: any;
  timestamp: string;
}

// Універсальний інтерфейс для адаптерів
export interface CaptionAdapter {
  // Ініціалізація та відновлення
  initialize(): Promise<OperationResult>;
  hydrate(data: HydrationData): void; // <-- ДОДАНО

  // Перевірка стану
  isCaptionsEnabled(): Promise<boolean>;
  isInMeeting(): Promise<boolean>;
  getRecordingState(): Promise<RecordingState>;

  // Управління субтитрами
  enableCaptions(): Promise<OperationResult>;
  disableCaptions(): Promise<OperationResult>;

  // Управління записом
  startRecording(): Promise<OperationResult>;
  stopRecording(): Promise<OperationResult>;
  pauseRecording(): Promise<OperationResult>;
  resumeRecording(): Promise<OperationResult>;
  hardStopRecording(): Promise<OperationResult>;

  // Отримання даних
  getCaptions(): CaptionEntry[];
  getChatMessages(): ChatMessage[];
  getMeetingInfo(): MeetingInfo;

  // Очищення
  clearData(): Promise<OperationResult>;
  cleanup(): Promise<OperationResult>;

  // Події
  on(event: string, callback: (data: any) => void): void;
  off(event: string, callback: (data: any) => void): void;
  emit(event: string, data: any): void;
}

// Типи для різних платформ
export interface GoogleMeetConfig extends AdapterConfig {
  platform: "google-meet";
  baseSelectors: {
    captionsContainer: string;
    chatContainer: string;
    meetingTitle: string;
    userName: string;
  };
  uiVersions: {
    1: {
      captionsButton: string;
      captionsButtonText: string;
      leaveButton: string;
      leaveButtonText: string;
    };
    2: {
      captionsButton: string;
      captionsButtonText: string;
      leaveButton: string;
      leaveButtonText: string;
    };
  };
}

export interface TeamsConfig extends AdapterConfig {
  platform: "teams";
  trackAttendees: boolean;
  autoOpenAttendees: boolean;
  selectors: {
    captionsContainer: string;
    captionMessage: string;
    captionAuthor: string;
    captionText: string;
    captionsButton: string;
    moreButton: string;
    languageSpeechButton: string;
    leaveButtons: string;
    chatContainer: string;
    chatMessage: string;
    attendeesContainer: string;
    attendeeItem: string;
    attendeeName: string;
    attendeeRole: string;
    peopleButton: string;
  };
  timing: {
    buttonClickDelay: number;
    retryDelay: number;
    mainLoopInterval: number;
    observerCheckInterval: number;
    attendeeUpdateInterval: number;
    initialAttendeeDelay: number;
  };
}

// Селектори для різних платформ
export interface PlatformSelectors {
  captionsContainer: string;
  captionText: string;
  speakerName: string;
  captionsButton: string;
  leaveButton: string;
  chatContainer?: string;
  chatMessage?: string;
  attendeesContainer?: string;
}

// Конфігурація селекторів
export interface SelectorsConfig {
  "google-meet": PlatformSelectors;
  teams: PlatformSelectors;
}
