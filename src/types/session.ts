
export type ExportFormat = "json" | "txt" | "srt" | "vtt" | "csv";
export type PlatformType = "google-meet" | "teams" | "unknown";
export type ErrorType = "unknown_error" | "not_authorized" | "incorrect_language" | "subtitles_disabled" | undefined;
export type StateType = "idle" | "starting" | "resuming" | "recording" | "paused" | "error";

export type ActiveSessionsBackup = {
  [tabId: number]: SessionData;
};

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

export type AttendeeEventType = "joined" | "left";
export interface AttendeeEvent {
  name: string;
  role?: string;
  action: AttendeeEventType;
  time: string;
}


export interface MeetingInfo {
  title: string;
  platform: PlatformType;
  url: string;
  startTime: string;
  attendees?: string[];
}

export const meetingInfoDefault: MeetingInfo = {
  title: "",
  platform: "unknown",
  url: "",
  startTime: "",
  attendees: [],
};

export interface RecordTimings {
  startTime?: string;
  lastPauseTime?: string;
  endTime?: string;
  totalDuration?: number;
}

export const recordTimingsDefault: RecordTimings = {
  startTime: "",
  lastPauseTime: "",
  endTime: "",
  totalDuration: 0,
};

export interface SessionState {
  isExtensionEnabled: boolean;
  isInitializedAdapter: boolean;

  isSupportedPlatform: boolean;
  currentPlatform: PlatformType;
  isInMeeting: boolean;

  isPanelVisible: boolean;

  state: StateType;
  error: ErrorType;
}

export const sessionStateDefault: SessionState = {
  isExtensionEnabled: false,
  isInitializedAdapter: false,
  isSupportedPlatform: false,
  currentPlatform: "unknown",
  isInMeeting: false,
  isPanelVisible: false,
  state: "idle",
  error: undefined,
};

export interface SessionData {
  id: string;
  isBackup?: boolean;
  isAutoSave?: boolean;
  sessionState: SessionState;
  captions: CaptionEntry[];
  chatMessages: ChatMessage[];
  attendeeEvents: AttendeeEvent[];
  meetingInfo: MeetingInfo;
  recordTimings: RecordTimings;
}

export const sessionDataDefault: SessionData = {
  sessionState: sessionStateDefault,
  id: "",
  isBackup: false,
  isAutoSave: false,
  captions: [],
  chatMessages: [],
  attendeeEvents: [],
  meetingInfo: meetingInfoDefault,
  recordTimings: recordTimingsDefault,
};


export interface ExportOptions {
  format: ExportFormat;
  includeTimestamps: boolean;
  includeSpeakers: boolean;
  includeChatMessages: boolean;
  filename?: string;
}

export interface OperationResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
  warning?: string;
}
