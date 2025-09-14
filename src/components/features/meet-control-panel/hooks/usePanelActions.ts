import { useCallback } from "react";
import { stateType, errorType, orientationType } from "../types";

interface UsePanelActionsProps {
  setState: (state: stateType) => void;
  setError: (error: errorType) => void;
  setPanelOrientation: (orientation: orientationType) => void;
  setIsCollapsed: (collapsed: boolean) => void;
  setIsSubtitlesEnabled: (enabled: boolean) => void;
  isSubtitlesEnabled: boolean;
  panelOrientation: orientationType;
  isCollapsed: boolean;
  sendResizeMessage: () => void;
  sendOrientationMessage: () => void;
}

// Функція для відправки повідомлень до content script
const sendMessageToContentScript = (message: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    // Використовуємо postMessage для комунікації з content script
    if (window.parent && window.parent !== window) {
      const messageId = `msg_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 9)}`;

      // Відправляємо повідомлення
      window.parent.postMessage(
        {
          type: "CAPTION_ACTION",
          action: message.type,
          messageId,
          data: message.data || {},
        },
        "*"
      );

      // Слухаємо відповідь
      const handleResponse = (event: MessageEvent) => {
        if (
          event.data.type === "CAPTION_RESPONSE" &&
          event.data.messageId === messageId
        ) {
          window.removeEventListener("message", handleResponse);
          if (event.data.success) {
            resolve(event.data.data);
          } else {
            reject(new Error(event.data.error || "Unknown error"));
          }
        }
      };

      window.addEventListener("message", handleResponse);

      // Timeout через 5 секунд
      setTimeout(() => {
        window.removeEventListener("message", handleResponse);
        reject(new Error("Request timeout"));
      }, 5000);
    } else {
      reject(new Error("Not in iframe context"));
    }
  });
};

export const usePanelActions = ({
  setState,
  setError,
  setPanelOrientation,
  setIsCollapsed,
  setIsSubtitlesEnabled,
  isSubtitlesEnabled,
  panelOrientation,
  isCollapsed,
  sendResizeMessage,
  sendOrientationMessage,
}: UsePanelActionsProps) => {
  // Обробник зміни стану запису
  const handleStateChange = useCallback(
    async (newState: stateType) => {
      try {
        let actionType: string;

        switch (newState) {
          case "recording":
            actionType = "start_caption_recording";
            break;
          case "paused":
            actionType = "pause_caption_recording";
            break;
          case "idle":
            actionType = "stop_caption_recording";
            break;
          default:
            return;
        }

        console.log(`🎬 [UI] Changing state to: ${newState} (${actionType})`);

        const response = await sendMessageToContentScript({
          type: actionType,
        });

        if (response?.success) {
          setState(newState);
          setError(undefined);
          console.log(`✅ [UI] ${actionType} successful:`, {
            newState,
            response: response.data,
            timestamp: new Date().toISOString(),
          });
        } else {
          setError("not_authorized");
          console.error(`❌ [UI] ${actionType} failed:`, {
            newState,
            error: response?.error,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error("❌ [UI] Error changing recording state:", {
          newState,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        });
        setError("not_authorized");
      }
    },
    [setState, setError]
  );

  const handleToggleSubtitles = useCallback(async () => {
    try {
      const newSubtitlesState = !isSubtitlesEnabled;

      console.log(
        `🎛️ [UI] Toggling subtitles: ${isSubtitlesEnabled} → ${newSubtitlesState}`
      );

      const response = await sendMessageToContentScript({
        type: "toggle_caption_subtitles",
        data: { enabled: newSubtitlesState },
      });

      if (response?.success) {
        setIsSubtitlesEnabled(newSubtitlesState);
        setError(undefined);
        console.log(
          `✅ [UI] Subtitles ${newSubtitlesState ? "enabled" : "disabled"}:`,
          {
            newState: newSubtitlesState,
            response: response.data,
            timestamp: new Date().toISOString(),
          }
        );
      } else {
        console.error("❌ [UI] Failed to toggle subtitles:", {
          newState: newSubtitlesState,
          error: response?.error,
          timestamp: new Date().toISOString(),
        });
        setError("subtitles_disabled");
      }
    } catch (error) {
      console.error("❌ [UI] Error toggling subtitles:", {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
      setError("subtitles_disabled");
    }
  }, [isSubtitlesEnabled, setIsSubtitlesEnabled, setError]);

  const handleOrientationToggle = useCallback(() => {
    const newOrientation =
      panelOrientation === "vertical" ? "horizontal" : "vertical";
    setPanelOrientation(newOrientation);

    // Send orientation change message after DOM update
    requestAnimationFrame(() => {
      sendOrientationMessage();
    });
  }, [panelOrientation, setPanelOrientation, sendOrientationMessage]);

  const handleMinimizeToggle = useCallback(() => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);

    // Send resize message after DOM update
    requestAnimationFrame(() => {
      sendResizeMessage();
    });
  }, [isCollapsed, setIsCollapsed, sendResizeMessage]);

  const handleErrorDismiss = useCallback(() => {
    setError(undefined);
  }, [setError]);

  // Обробник жорсткого видалення запису
  const handleDeleteRecording = useCallback(async () => {
    try {
      console.log("🗑️ [UI] Hard stopping recording and clearing all data");

      // Відправляємо окреме повідомлення для жорсткої зупинки
      const response = await sendMessageToContentScript({
        type: "hard_stop_caption_recording",
        data: {
          clearData: true,
          clearBackup: true,
          forceStop: true,
        },
      });

      if (response && response.success !== false) {
        setState("idle");
        setError(undefined);
        console.log("✅ [UI] Recording hard stopped and all data cleared:", {
          response: response.data,
          timestamp: new Date().toISOString(),
        });
      } else {
        console.error("❌ [UI] Failed to hard stop recording:", {
          error: response?.error,
          timestamp: new Date().toISOString(),
        });
        setError("not_authorized");
      }
    } catch (error) {
      console.error("❌ [UI] Error hard stopping recording:", {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
      setError("not_authorized");
    }
  }, [setState, setError]);

  // Функція для отримання поточного статусу
  const getCaptionStatus = useCallback(async () => {
    try {
      const response = await sendMessageToContentScript({
        type: "get_caption_status",
      });
      return response;
    } catch (error) {
      console.error("❌ Error getting caption status:", error);
      return null;
    }
  }, []);

  return {
    handleStateChange,
    handleToggleSubtitles,
    handleOrientationToggle,
    handleMinimizeToggle,
    handleErrorDismiss,
    handleDeleteRecording,
    getCaptionStatus,
  };
};
