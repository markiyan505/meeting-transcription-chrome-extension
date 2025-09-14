import { useState } from "react";
import { stateType, errorType, orientationType, PanelState } from "../types";

export const usePanelState = (): PanelState & {
  setState: (state: stateType) => void;
  setError: (error: errorType) => void;
  setPanelOrientation: (orientation: orientationType) => void;
  setIsCollapsed: (collapsed: boolean) => void;
  setIsSubtitlesEnabled: (enabled: boolean) => void;
} => {
  const [state, setState] = useState<stateType>("idle");
  const [error, setError] = useState<errorType>(undefined);
  const [panelOrientation, setPanelOrientation] =
    useState<orientationType>("vertical");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSubtitlesEnabled, setIsSubtitlesEnabled] = useState(false);

  return {
    state,
    error,
    panelOrientation,
    isCollapsed,
    isSubtitlesEnabled,
    setState,
    setError,
    setPanelOrientation,
    setIsCollapsed,
    setIsSubtitlesEnabled,
  };
};
