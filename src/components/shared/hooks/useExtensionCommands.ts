// src/hooks/useExtensionCommands.ts
import { useCallback } from "react";
import type { ChromeMessage } from "@/types/messages";

export const useExtensionCommands = () => {
  const sendCommand = useCallback((message: ChromeMessage) => {

    console.log(
      "[USE EXTENSION COMMANDS] Sending message to background:",
      message
    );
    chrome.runtime.sendMessage(message);
  }, []);

  return {
    startRecording: () => sendCommand({ type: "COMMAND.RECORDING.START" }),
    stopRecording: () => sendCommand({ type: "COMMAND.RECORDING.STOP" }),
    pauseRecording: () => sendCommand({ type: "COMMAND.RECORDING.PAUSE" }),
    resumeRecording: () => sendCommand({ type: "COMMAND.RECORDING.RESUME" }),
    deleteRecording: () => sendCommand({ type: "COMMAND.RECORDING.DELETE" }),

    togglePanelVisibility: () =>
      sendCommand({ type: "COMMAND.PANEL.TOGGLE_VISIBILITY" }),
    // toggleExtension: () =>
    //   sendCommand({ type: "COMMAND.EXTENSION.TOGGLE_ENABLED" }),

    refreshToken: () => sendCommand({ type: "COMMAND.AUTH.REFRESH_TOKEN" }),
    clearHistory: () => sendCommand({ type: "COMMAND.SESSION.CLEAR_HISTORY" }),
  };
};
