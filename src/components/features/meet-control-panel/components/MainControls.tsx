import React from "react";
import { orientationType } from "../types";
import { StateType, ErrorType } from "@/types/session";
import { TooltipPosition } from "@/components/shared/hooks/useTooltipPosition";
import { getOrientationClasses } from "../utils/getOrientationClasses";
import {
  NotAuthorizedErrorButton,
  SubtitlesDisabledErrorButton,
  IncorrectLanguageErrorButton,
  StartButton,
  PauseButton,
  StopButton,
  ResumeButton,
  DeleteButton,
} from "./MeetControlButtons";

import { useExtensionCommands } from "@/components/shared/hooks/useExtensionCommands";

interface MainControlsProps {
  state: StateType;
  error: ErrorType;
  orientation: orientationType;
  tooltipPosition: TooltipPosition;
}

export const MainControls: React.FC<MainControlsProps> = ({
  state,
  error,
  orientation,
  tooltipPosition,
}) => {
  const orientationClasses = getOrientationClasses(orientation);
  const {
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    deleteRecording,
  } = useExtensionCommands();

  const renderErrorButton = () => {
    switch (error) {
      case "not_authorized":
        return (
          <NotAuthorizedErrorButton
            tooltipPosition={tooltipPosition}
            onClick={() => {}}
          />
        );
      case "subtitles_disabled":
        return (
          <SubtitlesDisabledErrorButton
            tooltipPosition={tooltipPosition}
            onClick={() => {}}
          />
        );
      case "incorrect_language":
        return (
          <IncorrectLanguageErrorButton
            tooltipPosition={tooltipPosition}
            onClick={() => {}}
          />
        );
      default:
        return null;
    }
  };

  const renderStateButton = () => {
    switch (state) {
      case "idle":
      case "starting":
        return (
          <StartButton
            tooltipPosition={tooltipPosition}
            // loading={state === "starting"}
            onClick={() => startRecording()}
          />
        );
      case "paused":
      case "resuming":
        return (
          <ResumeButton
            tooltipPosition={tooltipPosition}
            // loading={state === "resuming"}
            onClick={() => resumeRecording()}
          />
        );
      case "recording":
        return (
          <PauseButton
            tooltipPosition={tooltipPosition}
            onClick={() => pauseRecording()}
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
          onClick={() => stopRecording()}
        />
      )}

      {state !== "idle" && (
        <DeleteButton
          tooltipPosition={tooltipPosition}
          onClick={() => deleteRecording()}
        />
      )}
    </div>
  );
};
