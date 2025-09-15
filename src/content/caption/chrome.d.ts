/**
 * Типи для Chrome Extension API
 */

export interface ExtensionStatusJSON {
  status: number;
  message: string;
}

export interface TranscriptBlock {
  personName: string;
  timestamp: string;
  transcriptText: string;
}

export interface ChatMessage {
  personName: string;
  timestamp: string;
  chatMessageText: string;
}

export interface ExtensionMessage {
  type: string;
  [key: string]: any;
}

export interface ExtensionResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export interface ResultLocal {
  extensionStatusJSON: ExtensionStatusJSON;
  transcript?: TranscriptBlock[];
  chatMessages?: ChatMessage[];
  meetingTitle?: string;
  meetingStartTimestamp?: string;
}

export interface ResultSync {
  operationMode?: "manual" | "automatic";
  autoEnableCaptions?: boolean;
  autoSaveOnEnd?: boolean;
  trackAttendees?: boolean;
}

declare global {
  interface Window {
  }
}
