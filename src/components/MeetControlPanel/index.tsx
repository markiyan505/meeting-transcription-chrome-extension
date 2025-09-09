import React, { useRef } from "react";
import { MeetPanel } from "@/components/ui/meet-panel";
import { Separator } from "@/components/ui/separator";
import { useTooltipPosition } from "@/components/hooks/useTooltipPosition";
import { usePanelState } from "./hooks/usePanelState";
import { usePanelActions } from "./hooks/usePanelActions";
import { getSeparatorOrientation } from "./utils/getOrientationClasses";
import { DragHandle } from "./components/DragHandle";
import { MainControls } from "./components/MainControls";
import { BottomControls } from "./components/BottomControls";

const MeetControlPanel: React.FC = () => {
  const panelState = usePanelState();
  const panelRef = useRef<HTMLDivElement>(null);

  const tooltipPosition = useTooltipPosition({
    panelOrientation: panelState.panelOrientation,
    panelRef,
  });

  const actions = usePanelActions({
    setState: panelState.setState,
    setError: panelState.setError,
    setPanelOrientation: panelState.setPanelOrientation,
    setIsCollapsed: panelState.setIsCollapsed,
    setIsSubtitlesEnabled: panelState.setIsSubtitlesEnabled,
    isSubtitlesEnabled: panelState.isSubtitlesEnabled,
    panelOrientation: panelState.panelOrientation,
    isCollapsed: panelState.isCollapsed,
  });

  return (
    <MeetPanel ref={panelRef} orientation={panelState.panelOrientation}>
      {/* Drag Handle */}
      <DragHandle orientation={panelState.panelOrientation} />

      {!panelState.isCollapsed && (
        <Separator
          orientation={getSeparatorOrientation(panelState.panelOrientation)}
        />
      )}

      {/* Main Controls */}
      {!panelState.isCollapsed && (
        <div className="flex-1 flex items-center justify-center p-1">
          <MainControls
            state={panelState.state}
            error={panelState.error}
            orientation={panelState.panelOrientation}
            isSubtitlesEnabled={panelState.isSubtitlesEnabled}
            tooltipPosition={tooltipPosition}
            onStateChange={panelState.setState}
            onErrorDismiss={actions.handleErrorDismiss}
            onToggleSubtitles={actions.handleToggleSubtitles}
          />
        </div>
      )}

      <Separator
        orientation={getSeparatorOrientation(panelState.panelOrientation)}
      />

      {/* Bottom Controls */}
      <BottomControls
        orientation={panelState.panelOrientation}
        isCollapsed={panelState.isCollapsed}
        tooltipPosition={tooltipPosition}
        state={panelState.state}
        error={panelState.error}
        onOrientationToggle={actions.handleOrientationToggle}
        onMinimizeToggle={actions.handleMinimizeToggle}
      />
    </MeetPanel>
  );
};

export default MeetControlPanel;
