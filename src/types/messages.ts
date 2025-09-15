/**
 * Centralized message types for Chrome Extension
 * Used for secure communication between background, content and popup scripts
 */

/**
 * Message types for communication between scripts
 */
export enum MessageType {
  // === CAPTION MANAGEMENT ===

  STATE_UPDATED = "state_updated",

  /** Get caption status */
  GET_CAPTION_STATUS = "get_caption_status",

  /** Start caption recording */
  START_CAPTION_RECORDING = "start_caption_recording",
  /** Stop caption recording */
  STOP_CAPTION_RECORDING = "stop_caption_recording",
  /** Force stop caption recording */
  HARD_STOP_CAPTION_RECORDING = "hard_stop_caption_recording",
  /** Pause caption recording */
  PAUSE_CAPTION_RECORDING = "pause_caption_recording",
  /** Resume caption recording */
  RESUME_CAPTION_RECORDING = "resume_caption_recording",

  /** Enable captions */
  ENABLE_CAPTIONS = "enable_captions",
  /** Disable captions */
  DISABLE_CAPTIONS = "disable_captions",

  /** Toggle captions */
  // TOGGLE_CAPTION_SUBTITLES = "toggle_caption_subtitles",

  // === DATA MANAGEMENT ===

  /** Save caption data */
  SAVE_CAPTION_DATA = "save_caption_data",
  /** Export caption data */
  EXPORT_CAPTION_DATA = "export_caption_data",

  /** Create caption data backup */
  BACKUP_CAPTION_DATA = "backup_caption_data",
  /** Clear caption data backup */
  CLEAR_CAPTION_BACKUP = "clear_caption_backup",
  /** Add caption data backup */
  ADD_BACKUP_TO_HISTORY = "add_backup_to_history",
  /** Check backup recovery */
  CHECK_BACKUP_RECOVERY = "check_backup_recovery",

  /** Get caption history */
  GET_CAPTION_HISTORY = "get_caption_history",
  /** Clear caption history */
  CLEAR_CAPTION_HISTORY = "clear_caption_history",
  /** Clean empty history entries */
  CLEANUP_EMPTY_HISTORY = "cleanup_empty_history",

  // === UI MANAGEMENT ===
  /** Update settings */
  UPDATE_SETTINGS = "update_settings",
  /** Toggle extension state */
  TOGGLE_EXTENSION_STATE = "toggle_extension_state",
  /** Toggle panel visibility */
  TOGGLE_PANEL_VISIBILITY = "toggle_panel_visibility",
  /** Update badge status */
  UPDATE_BADGE_STATUS = "update_badge_status",
}

/**
 * Response types for messages
 */
export enum ResponseType {
  /** Successful response */
  SUCCESS = "success",
  /** Error */
  ERROR = "error",
  /** Warning */
  WARNING = "warning",
  /** Information */
  INFO = "info",
}

/**
 * Base interface for all messages
 */
export interface BaseMessage {
  type: MessageType;
  data?: any;
  timestamp?: string;
}

/**
 * Interface for responses
 */
export interface BaseResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  timestamp?: string;
}

/**
 * Specific message types
 */
export interface CaptionDataMessage extends BaseMessage {
  type: MessageType.SAVE_CAPTION_DATA | MessageType.BACKUP_CAPTION_DATA;
  data: {
    captions: any[];
    chatMessages: any[];
    meetingInfo: any;
    attendeeReport: any;
    recordingState: string;
    timestamp: string;
    url: string;
    title: string;
  };
}

export interface BadgeStatusMessage extends BaseMessage {
  type: MessageType.UPDATE_BADGE_STATUS;
  data: {
    isRecording: boolean;
    captionCount?: number;
  };
}

export interface SettingsMessage extends BaseMessage {
  type: MessageType.UPDATE_SETTINGS;
  data: {
    [key: string]: any;
  };
}

export interface ExportMessage extends BaseMessage {
  type: MessageType.EXPORT_CAPTION_DATA;
  data: {
    sessionId: string;
    format: "json" | "txt" | "srt" | "vtt" | "csv";
    includeChat?: boolean;
    includeAttendees?: boolean;
  };
}

/**
 * Utility functions for working with messages
 */
export class MessageUtils {
  /**
   * Creates a base message
   */
  static createMessage(type: MessageType, data?: any): BaseMessage {
    return {
      type,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Створює успішну відповідь
   */
  static createSuccessResponse(data?: any, message?: string): BaseResponse {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Creates an error response
   */
  static createErrorResponse(error: string | Error, data?: any): BaseResponse {
    return {
      success: false,
      error: error instanceof Error ? error.message : error,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Checks if the message is valid
   */
  static isValidMessage(message: any): message is BaseMessage {
    return (
      message &&
      typeof message === "object" &&
      typeof message.type === "string" &&
      Object.values(MessageType).includes(message.type as MessageType)
    );
  }
}
