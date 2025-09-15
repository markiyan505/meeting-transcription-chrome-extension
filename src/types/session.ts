/**
 * Типи для роботи з сесіями та даними
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
  attendeeCount: number;
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
