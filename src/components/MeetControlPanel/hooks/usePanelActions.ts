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
}: UsePanelActionsProps) => {
  const handleToggleSubtitles = useCallback(() => {
    setIsSubtitlesEnabled(!isSubtitlesEnabled);
  }, [isSubtitlesEnabled, setIsSubtitlesEnabled]);

  const handleOrientationToggle = useCallback(() => {
    setPanelOrientation(
      panelOrientation === "vertical" ? "horizontal" : "vertical"
    );
  }, [panelOrientation, setPanelOrientation]);

  const handleMinimizeToggle = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed, setIsCollapsed]);

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
