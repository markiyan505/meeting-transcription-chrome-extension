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
  const handleToggleSubtitles = useCallback(() => {
    setIsSubtitlesEnabled(!isSubtitlesEnabled);
  }, [isSubtitlesEnabled, setIsSubtitlesEnabled]);

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

  return {
    handleToggleSubtitles,
    handleOrientationToggle,
    handleMinimizeToggle,
    handleErrorDismiss,
  };
};
