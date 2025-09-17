import { create } from "zustand";

import type {
  StateType,
  PlatformType,
  ErrorType,
  SessionState,
} from "@/types/session";

export interface CaptionActions {
  _syncState: (newState: Partial<SessionState>) => void;
}

export const initialState: SessionState = {
  state: "idle" as StateType,
  isExtensionEnabled: true,
  isInitializedAdapter: false,
  isInMeeting: false,
  isSupportedPlatform: false,
  isPanelVisible: true,
  error: undefined as ErrorType,
  currentPlatform: "unknown" as PlatformType,
};

export const useCaptionStore = create<SessionState & CaptionActions>((set) => ({
  ...initialState,

  _syncState: (newState) => {
    set((state) => {
      const updatedState = { ...state, ...newState };
      console.log("[CAPTION STORE] State updated:", updatedState);
      return updatedState;
    });
  },
}));

export const selectIsRecording = (state: SessionState) =>
  state.state === "recording" || state.state === "paused";

export const selectIsPaused = (state: SessionState) => state.state === "paused";
