import React from "react";
import {
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { orientationType, stateType, errorType } from "../types";
import { TooltipPosition } from "@/components/shared/hooks/useTooltipPosition";
import { getOrientationClasses } from "../utils/getOrientationClasses";
import { Button } from "@/components/shared/ui/button/Button";
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
        return <ChevronRight />;
      } else {
        return <ChevronDown />;
      }
    } else {
      if (orientation === "horizontal") {
        return <ChevronLeft />;
      } else {
        return <ChevronUp />;
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
        <Button
          variant="ghost"
          shape="pill"
          className="w-[18px] h-[18px] p-0"
          tooltip={
            orientation === "vertical" ? "Horizontal Layout" : "Vertical Layout"
          }
          tooltipPosition={tooltipPosition}
          onClick={onOrientationToggle}
        >
          <RotateCcw className="!h-3 !w-3" />
        </Button>
      )}

      <Button
        variant="ghost"
        shape="pill"
        className="w-[18px] h-[18px] p-0"
        // tooltip={isCollapsed ? "Expand" : "Collapse"}
        tooltipPosition={tooltipPosition}
        onClick={onMinimizeToggle}
      >
        {getMinimizeIcon()}
      </Button>
    </div>
  );
};
