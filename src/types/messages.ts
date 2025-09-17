import type { Session } from "@supabase/supabase-js";
import type { SettingsConfig } from "./settings";

import type {
  SessionState,
  SessionData,
  ErrorType,
  PlatformType,
  ExportFormat,
  AttendeeEvent,
  CaptionEntry,
  ChatMessage,
  MeetingInfo,
} from "./session";

export interface MeetingMetadata extends Partial<MeetingInfo> {}

// -----------------------------------------------------------------------------------
// GENERIC MESSAGE INTERFACES
// -----------------------------------------------------------------------------------

/** Base template for all commands. `P` is the payload type. */
interface Command<T extends string, P = void> {
  type: T;
  payload?: P;
}

/** Base template for all events. `P` is the payload type. */
interface Event<T extends string, P = void> {
  type: T;
  payload: P;
}

/** Base template for all queries. `P` is the payload type. `R` is the expected response type. */
interface Query<T extends string, P = void, R = any> {
  type: T;
  payload: P;
  _responseType?: R;
}

// -----------------------------------------------------------------------------------
// SPECIFIC MESSAGE DEFINITIONS
// -----------------------------------------------------------------------------------

// --- COMMANDS (Actions that change state) ---

// Recording Control
export type StartRecordingCommand = Command<"COMMAND.RECORDING.START">;
export type ReportRecordingStartedCommand =
  Command<"COMMAND.REPORT.RECORDING.STARTED">;
export type StopRecordingCommand = Command<"COMMAND.RECORDING.STOP">;
export type ReportRecordingResumedCommand =
  Command<"COMMAND.REPORT.RECORDING.RESUMED">;

export type PauseRecordingCommand = Command<"COMMAND.RECORDING.PAUSE">;
export type ResumeRecordingCommand = Command<"COMMAND.RECORDING.RESUME">;
export type DeleteRecordingCommand = Command<"COMMAND.RECORDING.DELETE">;

export type UpdateBadgeStatusCommand = Command<
  "COMMAND.BADGE.UPDATE_STATUS",
  { isRecording: boolean }
>;

export type ReportCommandFailedCommand = Command<
  "COMMAND.REPORT.COMMAND.FAILED",
  {
    failedCommandType: string;
    errorType: ErrorType;
  }
>;

export type UpsertSessionDataCommand = Command<
  "COMMAND.SESSION.UPSERT_DATA",
  {
    captions?: CaptionEntry[];
    chatMessages?: ChatMessage[];
    attendeeEvents?: AttendeeEvent[];
    meetingInfo?: Partial<MeetingMetadata>;
  }
>;

/** Sent by content script to check if it should recover from a backup. */
export type CheckBackupRecoveryQuery = Query<
  "QUERY.SESSION.CHECK_BACKUP",
  { url: string },
  SessionState | null
>;

// Session & Data Management
export type SaveSessionDataCommand = Command<
  "COMMAND.SESSION.SAVE",
  { tabId: number; data: SessionData }
>;
export type ExportSessionCommand = Command<
  "COMMAND.SESSION.EXPORT",
  { sessionId: string; format: ExportFormat }
>;

export type GetAppHistoryQuery = Query<
  "QUERY.APP.GET_HISTORY",
  void,
  { history: SessionData[] }
>;
export type ClearHistoryCommand = Command<"COMMAND.SESSION.CLEAR_HISTORY">;

// Extension & UI Control
export type ToggleExtensionEnabledCommand = Command<
  "COMMAND.EXTENSION.TOGGLE_ENABLED"
>;



export type TogglePanelVisibilityCommand = Command<
  "COMMAND.PANEL.TOGGLE_VISIBILITY",
  { tabId: number; isVisible: boolean }
>;

export type EnablePanelVisibilityCommand =
  Command<"COMMAND.PANEL.TOGGLE_ENABLED">;

export type DisablePanelVisibilityCommand =
  Command<"COMMAND.PANEL.TOGGLE_DISABLED">;

export type UpdateSettingsCommand = Command<
  "COMMAND.SETTINGS.UPDATE",
  { settings: Partial<SettingsConfig> }
>;

export type ContentScriptReadyCommand = Event<"EVENT.CONTENT.INITIALIZE">;

export type EnableContentScriptCommand = Command<
  "COMMAND.CONTENT.ENABLE",
  { isEnabled: boolean }
>;
export type RecoverFromBackupCommand = Command<
  "COMMAND.CONTENT.RECOVER_FROM_BACKUP",
  { recoveredState: any }
>;

export type ContentErrorEvent = Command<
  "EVENT.CONTENT.ERROR",
  { error: ErrorType }
>;

export type MeetingStatusChangedEvent = Command<
  "EVENT.CONTENT.MEETING_STATUS_CHANGED",
  { isInMeeting: boolean }
>;

export type PlatformInfoEvent = Command<
  "EVENT.CONTENT.PLATFORM_INFO",
  { isSupported: boolean; platform: PlatformType }
>;

/** Requests the entire state for UI initialization. */
export type GetAppStateQuery = Query<
  "QUERY.APP.GET_STATE",
  { tabId: number },
  SessionState
>;
export type StateChangedEvent = Event<
  "EVENT.STATE_CHANGED",
  { newState: Partial<SessionState>; sourceTabId?: number }
>;

export type ContextStateChangedEvent = Event<
  "EVENT.CONTEXT_STATE_CHANGED",
  { updatedState: Partial<SessionState> }
>;

export type ContextDataChangedEvent = Event<
  "EVENT.CONTEXT_DATA_CHANGED",
  { newState: Partial<SessionData>; sourceTabId?: number }
>;

// Authentication
export type RefreshTokenCommand = Command<"COMMAND.AUTH.REFRESH_TOKEN">;
export type UpdateAuthSessionCommand = Command<
  "COMMAND.AUTH.UPDATE_SESSION",
  { session: Session | null }
>;
export type ClearAuthSessionCommand = Command<"COMMAND.AUTH.CLEAR_SESSION">;
/** Requests the current authentication status. */
export type GetAuthStatusQuery = Query<
  "QUERY.AUTH.GET_STATUS",
  void,
  {
    isAuthenticated: boolean;
    session: Session | null;
    tokenExpiry?: number;
  }
>;

/** Fired when authentication state changes. */
export type AuthStateChangedEvent = Event<
  "EVENT.AUTH_STATE_CHANGED",
  {
    isAuthenticated: boolean;
    session: Session | null;
  }
>;

// -----------------------------------------------------------------------------------
// MAIN MESSAGE UNION TYPE
// -----------------------------------------------------------------------------------

/** A union of all possible messages. */
export type ChromeMessage =
  // Commands
  | StartRecordingCommand
  | StopRecordingCommand
  | PauseRecordingCommand
  | ResumeRecordingCommand
  | DeleteRecordingCommand
  | SaveSessionDataCommand
  | ExportSessionCommand
  | ClearHistoryCommand
  | ToggleExtensionEnabledCommand
  | TogglePanelVisibilityCommand
  | EnablePanelVisibilityCommand
  | DisablePanelVisibilityCommand
  | UpdateSettingsCommand
  | RefreshTokenCommand
  | UpdateAuthSessionCommand
  | ClearAuthSessionCommand
  | ReportRecordingStartedCommand
  | ReportRecordingResumedCommand
  | ReportCommandFailedCommand
  | UpsertSessionDataCommand
  | UpdateBadgeStatusCommand
  | ContentScriptReadyCommand
  // Additional commands
  // Events
  | StateChangedEvent
  | ContextStateChangedEvent
  | ContextDataChangedEvent
  | AuthStateChangedEvent
  | MeetingStatusChangedEvent
  | PlatformInfoEvent
  | EnableContentScriptCommand
  | RecoverFromBackupCommand
  // Queries
  | GetAppStateQuery
  | GetAppHistoryQuery
  | GetAuthStatusQuery
  | CheckBackupRecoveryQuery;
