import { useCallback } from "react";
import { stateType, orientationType } from "../types";
import { useCaptionStore } from "@/store/captionStore";

interface UsePanelActionsProps {
  panelOrientation: orientationType;
  isCollapsed: boolean;
  setPanelOrientation: (orientation: orientationType) => void;
  setIsCollapsed: (collapsed: boolean) => void;
  sendResizeMessage: () => void;
  sendOrientationMessage: () => void;
}

export const usePanelActions = ({
  setPanelOrientation,
  setIsCollapsed,
  panelOrientation,
  isCollapsed,
  sendResizeMessage,
  sendOrientationMessage,
}: UsePanelActionsProps) => {

  const {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    hardStopRecording,
    isPaused, 
  } = useCaptionStore();
  
    const handleStateChange = useCallback((newState: stateType) => {
    if (newState === "recording") {
      isPaused ? resumeRecording() : startRecording();
    } else if (newState === "paused") {
      pauseRecording();
    } else if (newState === "idle") {
      stopRecording();
    }
  }, [isPaused, startRecording, stopRecording, pauseRecording, resumeRecording]);


  const handleOrientationToggle = useCallback(() => {
    const newOrientation = panelOrientation === "vertical" ? "horizontal" : "vertical";
    setPanelOrientation(newOrientation);
    requestAnimationFrame(() => sendOrientationMessage());
  }, [panelOrientation, setPanelOrientation, sendOrientationMessage]);

  const handleMinimizeToggle = useCallback(() => {
    setIsCollapsed(!isCollapsed);
    requestAnimationFrame(() => sendResizeMessage());
  }, [isCollapsed, setIsCollapsed, sendResizeMessage]);

  const handleDeleteRecording = useCallback(() => {
    hardStopRecording();
  }, [hardStopRecording]);

  return {
    handleStateChange,
    handleOrientationToggle,
    handleMinimizeToggle,
    handleDeleteRecording,
  };
};