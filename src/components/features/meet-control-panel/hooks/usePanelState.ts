import { useState } from "react";
import { orientationType, LocalPanelState } from "../types";

export const usePanelState = (): LocalPanelState & {
  setPanelOrientation: (orientation: orientationType) => void;
  setIsCollapsed: (collapsed: boolean) => void;
} => {
  const [panelOrientation, setPanelOrientation] = useState<orientationType>("vertical");
  const [isCollapsed, setIsCollapsed] = useState(false);

  return {
    panelOrientation,
    isCollapsed,
    setPanelOrientation,
    setIsCollapsed,
  };
};
