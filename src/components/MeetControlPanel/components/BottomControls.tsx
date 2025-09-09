import React from "react";
import {
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { orientationType, stateType, errorType } from "../types";
import { TooltipPosition } from "@/components/hooks/useTooltipPosition";
import { getOrientationClasses } from "../utils/getOrientationClasses";
import { MeetButton } from "@/components/ui/button";
import { StatusIndicator } from "./StatusIndicator";

interface BottomControlsProps {
  orientation: orientationType;
  isCollapsed: boolean;
  tooltipPosition: TooltipPosition;
  state: stateType;
  error: errorType;
  onOrientationToggle: () => void;
  onMinimizeToggle: () => void;
}

export const BottomControls: React.FC<BottomControlsProps> = ({
  orientation,
  isCollapsed,
  tooltipPosition,
  state,
  error,
  onOrientationToggle,
  onMinimizeToggle,
}) => {
  const orientationClasses = getOrientationClasses(orientation, true);

  const getMinimizeIcon = () => {
    if (isCollapsed) {
      if (orientation === "horizontal") {
        return <ChevronRight className="h-4 w-4" />;
      } else {
        return <ChevronDown className="h-4 w-4" />;
      }
    } else {
      if (orientation === "horizontal") {
        return <ChevronLeft className="h-4 w-4" />;
      } else {
        return <ChevronUp className="h-4 w-4" />;
      }
    }
  };

  return (
    <div
      className={`flex w-full h-full justify-center items-center gap-1 ${orientationClasses}`}
    >
      {isCollapsed ? (
        <StatusIndicator state={state} error={error} />
      ) : (
        <MeetButton
          variant="ghost"
          size="sm"
          tooltip={
            orientation === "vertical" ? "Horizontal Layout" : "Vertical Layout"
          }
          tooltipPosition={tooltipPosition}
          onClick={onOrientationToggle}
        >
          <RotateCcw className="h-3 w-3" />
        </MeetButton>
      )}

      <MeetButton
        variant="ghost"
        size="sm"
        // tooltip={isCollapsed ? "Expand" : "Collapse"}
        tooltipPosition={tooltipPosition}
        onClick={onMinimizeToggle}
      >
        {getMinimizeIcon()}
      </MeetButton>
    </div>
  );
};
