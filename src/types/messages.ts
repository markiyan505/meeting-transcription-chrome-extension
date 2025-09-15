/**
 * Централізовані типи повідомлень для Chrome Extension
 * Використовується для безпечної комунікації між background, content та popup скриптами
 */

/**
 * Типи повідомлень для комунікації між скриптами
 */
export enum MessageType {
  // === CAPTION MANAGEMENT ===

  STATE_UPDATED = "state_updated",

  /** Отримати статус субтитрів */
  GET_CAPTION_STATUS = "get_caption_status",


  /** Почати запис субтитрів */
  START_CAPTION_RECORDING = "start_caption_recording",
  /** Зупинити запис субтитрів */
  STOP_CAPTION_RECORDING = "stop_caption_recording",
  /** Примусово зупинити запис субтитрів */
  HARD_STOP_CAPTION_RECORDING = "hard_stop_caption_recording",
  /** Призупинити запис субтитрів */
  PAUSE_CAPTION_RECORDING = "pause_caption_recording",
  /** Відновити запис субтитрів */
  RESUME_CAPTION_RECORDING = "resume_caption_recording",


  /** Увімкнути субтитри */
  ENABLE_CAPTIONS = "enable_captions",
  /** Вимкнути субтитри */
  DISABLE_CAPTIONS = "disable_captions",





  /** Перемкнути субтитри */
  // TOGGLE_CAPTION_SUBTITLES = "toggle_caption_subtitles",

  // === DATA MANAGEMENT ===

  /** Зберегти дані субтитрів */
  SAVE_CAPTION_DATA = "save_caption_data",
  /** Експортувати дані субтитрів */
  EXPORT_CAPTION_DATA = "export_caption_data",

  /** Створити бекап даних субтитрів */
  BACKUP_CAPTION_DATA = "backup_caption_data",
  /** Очистити бекап даних субтитрів */
  CLEAR_CAPTION_BACKUP = "clear_caption_backup",
  /** Додати бекап даних субтитрів */
  ADD_BACKUP_TO_HISTORY = "add_backup_to_history",
  /** Перевірити відновлення з бекапу */
  CHECK_BACKUP_RECOVERY = "check_backup_recovery",

  /** Отримати історію субтитрів */
  GET_CAPTION_HISTORY = "get_caption_history",
  /** Очистити історію субтитрів */
  CLEAR_CAPTION_HISTORY = "clear_caption_history",
  /** Очистити порожні записи історії */
  CLEANUP_EMPTY_HISTORY = "cleanup_empty_history",

  // === UI MANAGEMENT ===
  /** Оновити налаштування */
  UPDATE_SETTINGS = "update_settings",
  /** Перемкнути стан розширення */
  TOGGLE_EXTENSION_STATE = "toggle_extension_state",
  /** Перемкнути видимість панелі */
  TOGGLE_PANEL_VISIBILITY = "toggle_panel_visibility",
  /** Оновити статус бейджа */
  UPDATE_BADGE_STATUS = "update_badge_status",
}

/**
 * Типи відповідей для повідомлень
 */
export enum ResponseType {
  /** Успішна відповідь */
  SUCCESS = "success",
  /** Помилка */
  ERROR = "error",
  /** Попередження */
  WARNING = "warning",
  /** Інформація */
  INFO = "info",
}

/**
 * Базовий інтерфейс для всіх повідомлень
 */
export interface BaseMessage {
  type: MessageType;
  data?: any;
  timestamp?: string;
}

/**
 * Інтерфейс для відповідей
 */
export interface BaseResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  timestamp?: string;
}

/**
 * Специфічні типи повідомлень
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
 * Утилітні функції для роботи з повідомленнями
 */
export class MessageUtils {
  /**
   * Створює базове повідомлення
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
   * Створює відповідь з помилкою
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
   * Перевіряє, чи є повідомлення валідним
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
