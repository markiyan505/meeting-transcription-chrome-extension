/**
 * Універсальні типи для модуля зчитування субтитрів
 */

// Базові типи для субтитрів
export interface CaptionEntry {
  id: string;
  speaker: string;
  text: string;
  timestamp: string;
  startTime?: number;
  endTime?: number;
}

export interface ChatMessage {
  id: string;
  speaker: string;
  message: string;
  timestamp: string;
}

export interface MeetingInfo {
  title: string;
  startTime: string;
  endTime?: string;
  attendees: string[];
  platform: "google-meet" | "teams" | "unknown";
}

// Дані для відновлення сесії
export interface HydrationData {
  captions: CaptionEntry[];
  chatMessages: ChatMessage[];
  meetingInfo: MeetingInfo;
}

// Уніфіковані дані сесії для збереження та бекапу
export interface SessionData {
  id: string;
  timestamp: string;
  url: string;
  title: string;
  captions: CaptionEntry[];
  chatMessages: ChatMessage[];
  meetingInfo: MeetingInfo;
  attendeeReport: any | null;
  recordingState: RecordingState | string;
  isBackup?: boolean;
}

// Стан запису
export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  startTime?: string;
  pauseTime?: string;
  totalPauseDuration: number;
  captionCount: number;
  chatMessageCount: number;
}

// Формати експорту
export type ExportFormat = "json" | "txt" | "srt" | "vtt" | "csv";

export interface ExportOptions {
  format: ExportFormat;
  includeTimestamps: boolean;
  includeSpeakers: boolean;
  includeChatMessages: boolean;
  filename?: string;
}

// Результат операції
export interface OperationResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
  warning?: string;
}

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

  // Отримання даних
  getCaptions(): CaptionEntry[];
  getChatMessages(): ChatMessage[];
  getMeetingInfo(): MeetingInfo;

  // Експорт
  exportData(options: ExportOptions): Promise<OperationResult>;

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
