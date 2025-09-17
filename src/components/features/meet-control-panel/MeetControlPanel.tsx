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

import { useSyncCaptionStore } from "@/store/useSyncCaptionStore";
import { StateType } from "@/types/session";

import { useCaptionStore, selectIsRecording } from "@/store/captionStore";

const MeetControlPanel: React.FC = () => {
  useSyncCaptionStore();

  const { state, error } = useCaptionStore();
  const isRecording = useCaptionStore(selectIsRecording);

  const { panelOrientation, isCollapsed, setPanelOrientation, setIsCollapsed } =
    usePanelState();

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
    error: error,
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
            error={error}
            orientation={panelOrientation}
            tooltipPosition={tooltipPosition}
          />
        </div>
      )}

      <Separator orientation={getSeparatorOrientation(panelOrientation)} />

      <BottomControls
        orientation={panelOrientation}
        isCollapsed={isCollapsed}
        tooltipPosition={tooltipPosition}
        state={state}
        error={error}
        onOrientationToggle={actions.handleOrientationToggle}
        onMinimizeToggle={actions.handleMinimizeToggle}
      />
    </MeetPanel>
  );
};

export default MeetControlPanel;
