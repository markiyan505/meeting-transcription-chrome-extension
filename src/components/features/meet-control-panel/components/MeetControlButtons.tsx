import React from "react";
import {
  Play,
  Pause,
  Square,
  Subtitles,
  User,
  Languages,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button/Button";
import { TooltipPosition } from "@/components/shared/hooks/useTooltipPosition";

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
    <Button
      variant="warning"
      tooltip="Not Authorized"
      shape="pill"
      size="default_square"
      tooltipPosition={tooltipPosition}
      onClick={onClick}
    >
      <User />
    </Button>
  );
};

export const SubtitlesDisabledErrorButton: React.FC<ControlButtonsProps> = ({
  tooltipPosition,
  onClick,
}) => {
  return (
    <Button
      variant="warning"
      tooltip="Enable Subtitles"
      shape="pill"
      size="default_square"
      tooltipPosition={tooltipPosition}
      onClick={onClick}
    >
      <Subtitles />
    </Button>
  );
};

export const IncorrectLanguageErrorButton: React.FC<ControlButtonsProps> = ({
  tooltipPosition,
  onClick,
}) => {
  return (
    <Button
      variant="warning"
      tooltip="Language Issue"
      shape="pill"
      size="default_square"
      tooltipPosition={tooltipPosition}
      onClick={onClick}
    >
      <Languages />
    </Button>
  );
};

export const StartButton: React.FC<ControlButtonsProps> = ({
  tooltipPosition,
  onClick,
}) => (
  <Button
    variant="primary"
    tooltip="Start Recording"
    shape="pill"
    size="default_square"
    tooltipPosition={tooltipPosition}
    onClick={onClick}
  >
    <Play />
  </Button>
);

export const PauseButton: React.FC<ControlButtonsProps> = ({
  tooltipPosition,
  onClick,
}) => (
  <Button
    variant="warning"
    tooltip="Pause Recording"
    shape="pill"
    size="default_square"
    tooltipPosition={tooltipPosition}
    onClick={onClick}
  >
    <Pause />
  </Button>
);

export const StopButton: React.FC<ControlButtonsProps> = ({
  tooltipPosition,
  onClick,
}) => (
  <Button
    variant="danger"
    tooltip="Stop Recording"
    shape="pill"
    size="default_square"
    tooltipPosition={tooltipPosition}
    onClick={onClick}
  >
    <Square />
  </Button>
);

export const ResumeButton: React.FC<ControlButtonsProps> = ({
  tooltipPosition,
  onClick,
}) => (
  <Button
    variant="primary"
    tooltip="Resume Recording"
    shape="pill"
    size="default_square"
    tooltipPosition={tooltipPosition}
    onClick={onClick}
  >
    <Play />
  </Button>
);

export const SubtitlesButton: React.FC<SubtitlesButtonProps> = ({
  tooltipPosition,
  onClick,
  active = false,
}) => (
  <Button
    variant={active ? "primary" : "default"}
    tooltip={active ? "Disable Subtitles" : "Enable Subtitles"}
    shape="pill"
    size="default_square"
    tooltipPosition={tooltipPosition}
    onClick={onClick}
  >
    <Subtitles />
  </Button>
);

export const DeleteButton: React.FC<ControlButtonsProps> = ({
  tooltipPosition,
  onClick,
}) => (
  <Button
    variant="danger"
    tooltip="Delete Recording"
    shape="pill"
    size="default_square"
    tooltipPosition={tooltipPosition}
    onClick={onClick}
  >
    <Trash2 />
  </Button>
);
