/**
 * Universal types for the caption module
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

export interface AdapterConfig {
  platform: string;
  autoEnableCaptions: boolean;
  autoSaveOnEnd: boolean;
  trackAttendees: boolean;
  operationMode: "manual" | "automatic";
}

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

export interface CaptionAdapter {
  initialize(): Promise<OperationResult>;
  hydrate(data: HydrationData): void;

  isCaptionsEnabled(): Promise<boolean>;
  isInMeeting(): Promise<boolean>;
  getRecordingState(): Promise<RecordingState>;

  enableCaptions(): Promise<OperationResult>;
  disableCaptions(): Promise<OperationResult>;

  startRecording(): Promise<OperationResult>;
  stopRecording(): Promise<OperationResult>;
  pauseRecording(): Promise<OperationResult>;
  resumeRecording(): Promise<OperationResult>;
  hardStopRecording(): Promise<OperationResult>;

  getCaptions(): CaptionEntry[];
  getChatMessages(): ChatMessage[];
  getMeetingInfo(): MeetingInfo;

  clearData(): Promise<OperationResult>;
  cleanup(): Promise<OperationResult>;

  on(event: string, callback: (data: any) => void): void;
  off(event: string, callback: (data: any) => void): void;
  emit(event: string, data: any): void;
}

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

export interface SelectorsConfig {
  "google-meet": PlatformSelectors;
  teams: PlatformSelectors;
}
