import React, { useRef } from "react";
import { MeetPanel } from "./components/MeetPanel";
import { Separator } from "@/components/shared/ui/separator/Separator";
import { useTooltipPosition } from "@/components/shared/hooks/useTooltipPosition";
import { usePanelState } from "./hooks/usePanelState";
import { usePanelActions } from "./hooks/usePanelActions";
import { usePanelResize } from "./hooks/usePanelResize";
import { getSeparatorOrientation } from "./utils/getOrientationClasses";
import { DragHandle } from "./components/DragHandle";
import { MainControls } from "./components/MainControls";
import { BottomControls } from "./components/BottomControls";

import { useCaptionStore } from "@/store/captionStore";
import { useSyncCaptionStore } from "@/store/useSyncCaptionStore";
import { stateType } from "./types";

const MeetControlPanel: React.FC = () => {
  useSyncCaptionStore();
  const { isRecording, isPaused, isError } = useCaptionStore();
  const { panelOrientation, isCollapsed, setPanelOrientation, setIsCollapsed } =
    usePanelState();

  const state: stateType = isRecording
    ? isPaused
      ? "paused"
      : "recording"
    : "idle";

  const panelRef = useRef<HTMLDivElement>(null);

  const tooltipPosition = useTooltipPosition({
    panelOrientation,
    panelRef,
  });

  const { sendResizeMessage, sendOrientationMessage } = usePanelResize({
    panelRef,
    orientation: panelOrientation,
    isCollapsed: isCollapsed,
    state: state,
    error: isError,
  });

  const actions = usePanelActions({
    setPanelOrientation,
    setIsCollapsed,
    panelOrientation,
    isCollapsed,
    sendResizeMessage,
    sendOrientationMessage,
  });

  return (
    <MeetPanel ref={panelRef} orientation={panelOrientation}>
      <DragHandle orientation={panelOrientation} />

      {!isCollapsed && (
        <Separator orientation={getSeparatorOrientation(panelOrientation)} />
      )}

      {!isCollapsed && (
        <div className="flex-1 flex items-center justify-center p-1">
          <MainControls
            state={state}
            error={isError}
            orientation={panelOrientation}
            tooltipPosition={tooltipPosition}
            onStateChange={actions.handleStateChange}
            onDeleteRecording={actions.handleDeleteRecording}
          />
        </div>
      )}

      <Separator orientation={getSeparatorOrientation(panelOrientation)} />

      <BottomControls
        orientation={panelOrientation}
        isCollapsed={isCollapsed}
        tooltipPosition={tooltipPosition}
        state={state}
        error={isError}
        onOrientationToggle={actions.handleOrientationToggle}
        onMinimizeToggle={actions.handleMinimizeToggle}
      />
    </MeetPanel>
  );
};

export default MeetControlPanel;
