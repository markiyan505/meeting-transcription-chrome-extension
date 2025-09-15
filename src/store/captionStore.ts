import { create } from "zustand";
import { MessageType } from "@/types/messages";
import { errorType } from "@/components/features/meet-control-panel/types";

export interface CaptionState {
  isInitialized: boolean;
  isInMeeting: boolean;
  isSupportedPlatform: boolean;
  isExtensionEnabled: boolean;
  isPanelVisible: boolean;

  isRecording: boolean;
  isPaused: boolean;
  isError: errorType;

  currentPlatform: string;
}

export interface CaptionActions {
  startRecording: () => void;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  hardStopRecording: () => void;
  toggleExtension: () => void;
  togglePanelVisibility: () => void;

  _syncState: (newState: Partial<CaptionState>) => void;
}

const initialState: CaptionState = {
  isExtensionEnabled: true,
  isInitialized: false,
  isInMeeting: false,
  isSupportedPlatform: false,
  isPanelVisible: true,
  isRecording: false,
  isPaused: false,
  isError: undefined,
  currentPlatform: "unknown",
};

export const useCaptionStore = create<CaptionState & CaptionActions>((set) => ({
  ...initialState,

  startRecording: () =>
    chrome.runtime.sendMessage({ type: MessageType.START_CAPTION_RECORDING }),
  stopRecording: () =>
    chrome.runtime.sendMessage({ type: MessageType.STOP_CAPTION_RECORDING }),
  pauseRecording: () =>
    chrome.runtime.sendMessage({ type: MessageType.PAUSE_CAPTION_RECORDING }),
  resumeRecording: () =>
    chrome.runtime.sendMessage({ type: MessageType.RESUME_CAPTION_RECORDING }),
  hardStopRecording: () =>
    chrome.runtime.sendMessage({
      type: MessageType.HARD_STOP_CAPTION_RECORDING,
    }),

  toggleExtension: () => {
    chrome.runtime.sendMessage({ type: MessageType.TOGGLE_EXTENSION_STATE });
  },
  togglePanelVisibility: () => {
    chrome.runtime.sendMessage({ type: MessageType.TOGGLE_PANEL_VISIBILITY });
  },

  _syncState: (newState) => set((state) => ({ ...state, ...newState })),
}));
