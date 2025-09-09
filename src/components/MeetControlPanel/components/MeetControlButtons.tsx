import React from "react";
import { Play, Pause, Square, Subtitles, User, Languages } from "lucide-react";
import { MeetButton } from "@/components/ui/button";
import { TooltipPosition } from "@/components/hooks/useTooltipPosition";

interface ControlButtonsProps {
  tooltipPosition: TooltipPosition;
  onClick: () => void;
}

interface SubtitlesButtonProps extends ControlButtonsProps {
  active?: boolean;
}

export const NotAuthorizedErrorButton: React.FC<ControlButtonsProps> = ({
  tooltipPosition,
  onClick,
}) => {
  return (
    <MeetButton
      variant="warning"
      tooltip="Not Authorized"
      tooltipPosition={tooltipPosition}
      onClick={onClick}
    >
      <User className="h-4 w-4" />
    </MeetButton>
  );
};

export const SubtitlesDisabledErrorButton: React.FC<ControlButtonsProps> = ({
  tooltipPosition,
  onClick,
}) => {
  return (
    <MeetButton
      variant="warning"
      tooltip="Enable Subtitles"
      tooltipPosition={tooltipPosition}
      onClick={onClick}
    >
      <Subtitles className="h-4 w-4" />
    </MeetButton>
  );
};

export const IncorrectLanguageErrorButton: React.FC<ControlButtonsProps> = ({
  tooltipPosition,
  onClick,
}) => {
  return (
    <MeetButton
      variant="warning"
      tooltip="Language Issue"
      tooltipPosition={tooltipPosition}
      onClick={onClick}
    >
      <Languages className="h-4 w-4" />
    </MeetButton>
  );
};

export const StartButton: React.FC<ControlButtonsProps> = ({
  tooltipPosition,
  onClick,
}) => (
  <MeetButton
    variant="primary"
    tooltip="Start Recording"
    tooltipPosition={tooltipPosition}
    onClick={onClick}
  >
    <Play className="h-4 w-4" />
  </MeetButton>
);

export const PauseButton: React.FC<ControlButtonsProps> = ({
  tooltipPosition,
  onClick,
}) => (
  <MeetButton
    variant="warning"
    tooltip="Pause Recording"
    tooltipPosition={tooltipPosition}
    onClick={onClick}
  >
    <Pause className="h-4 w-4" />
  </MeetButton>
);

export const StopButton: React.FC<ControlButtonsProps> = ({
  tooltipPosition,
  onClick,
}) => (
  <MeetButton
    variant="danger"
    tooltip="Stop Recording"
    tooltipPosition={tooltipPosition}
    onClick={onClick}
  >
    <Square className="h-4 w-4" />
  </MeetButton>
);

export const ResumeButton: React.FC<ControlButtonsProps> = ({
  tooltipPosition,
  onClick,
}) => (
  <MeetButton
    variant="primary"
    tooltip="Resume Recording"
    tooltipPosition={tooltipPosition}
    onClick={onClick}
  >
    <Play className="h-4 w-4" />
  </MeetButton>
);

export const SubtitlesButton: React.FC<SubtitlesButtonProps> = ({
  tooltipPosition,
  onClick,
  active = false,
}) => (
  <MeetButton
    variant={active ? "primary" : "default"}
    tooltip={active ? "Disable Subtitles" : "Enable Subtitles"}
    tooltipPosition={tooltipPosition}
    onClick={onClick}
  >
    <Subtitles className="h-4 w-4" />
  </MeetButton>
);
