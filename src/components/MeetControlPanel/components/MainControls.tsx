import React from "react";
import { stateType, errorType, orientationType } from "../types";
import { TooltipPosition } from "@/components/hooks/useTooltipPosition";
import { getOrientationClasses } from "../utils/getOrientationClasses";
import {
  NotAuthorizedErrorButton,
  SubtitlesDisabledErrorButton,
  IncorrectLanguageErrorButton,
  StartButton,
  PauseButton,
  StopButton,
  ResumeButton,
  SubtitlesButton,
} from "@/components/ui/control-buttons";

interface MainControlsProps {
  state: stateType;
  error: errorType;
  orientation: orientationType;
  isSubtitlesEnabled: boolean;
  tooltipPosition: TooltipPosition;
  onStateChange: (state: stateType) => void;
  onErrorDismiss: () => void;
  onToggleSubtitles: () => void;
}

export const MainControls: React.FC<MainControlsProps> = ({
  state,
  error,
  orientation,
  isSubtitlesEnabled,
  tooltipPosition,
  onStateChange,
  onErrorDismiss,
  onToggleSubtitles,
}) => {
  const orientationClasses = getOrientationClasses(orientation);

  const renderErrorButton = () => {
    switch (error) {
      case "not_authorized":
        return (
          <NotAuthorizedErrorButton
            tooltipPosition={tooltipPosition}
            onClick={onErrorDismiss}
          />
        );
      case "subtitles_disabled":
        return (
          <SubtitlesDisabledErrorButton
            tooltipPosition={tooltipPosition}
            onClick={onErrorDismiss}
          />
        );
      case "incorrect_language":
        return (
          <IncorrectLanguageErrorButton
            tooltipPosition={tooltipPosition}
            onClick={onErrorDismiss}
          />
        );
      default:
        return null;
    }
  };

  const renderStateButton = () => {
    switch (state) {
      case "idle":
        return (
          <StartButton
            tooltipPosition={tooltipPosition}
            onClick={() => onStateChange("recording")}
          />
        );
      case "paused":
        return (
          <ResumeButton
            tooltipPosition={tooltipPosition}
            onClick={() => onStateChange("recording")}
          />
        );
      case "recording":
        return (
          <PauseButton
            tooltipPosition={tooltipPosition}
            onClick={() => onStateChange("paused")}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`flex gap-1 ${orientationClasses}`}>
      {error ? renderErrorButton() : renderStateButton()}

      {state !== "idle" && (
        <StopButton
          tooltipPosition={tooltipPosition}
          onClick={() => onStateChange("idle")}
        />
        
      )}

      {state !== "idle" && (
        <SubtitlesButton
          tooltipPosition={tooltipPosition}
          onClick={onToggleSubtitles}
          active={isSubtitlesEnabled}
        />
      )}

    </div>
  );
};
