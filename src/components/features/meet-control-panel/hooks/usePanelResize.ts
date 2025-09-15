import { useCallback, useEffect, useRef } from "react";
import { orientationType, stateType, errorType } from "../types";

// Function to send messages to parent window (content script)
const sendMessageToParent = (message: any) => {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage(message, "*");
  }
};

interface UsePanelResizeProps {
  panelRef: React.RefObject<HTMLDivElement>;
  orientation: orientationType;
  isCollapsed: boolean;
  state: stateType;
  error: errorType;
}

export const usePanelResize = ({
  panelRef,
  orientation,
  isCollapsed,
  state,
  error,
}: UsePanelResizeProps) => {
  // const resizeObserverRef = useRef<ResizeObserver | null>(null);
  // const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentStateRef = useRef({ orientation, isCollapsed, state, error });

  // Function to calculate panel dimensions based on state
  const calculatePanelDimensions = useCallback(
    (
      orientation: orientationType,
      isCollapsed: boolean,
      state: stateType,
      error: errorType
    ) => {
      let width: number;
      let height: number;

      if (isCollapsed) {
        width = 50;
        height = 54;
      } else {
        if (state === "idle") {
          height = 107;
        } else if ((state === "recording" || state === "paused") && !error) {
          height = 195;
        } else {
          height = 151;
        }
        width = 50;
      }

      if (orientation === "horizontal") {
        return { width: height, height: width };
      }

      return { width, height };
    },
    []
  );

  const sendResizeMessage = useCallback(() => {
    if (!panelRef.current) return;

    // Use current state from ref to avoid stale closure values
    const currentState = currentStateRef.current;

    // Calculate exact dimensions based on state
    const { width, height } = calculatePanelDimensions(
      currentState.orientation,
      currentState.isCollapsed,
      currentState.state,
      currentState.error
    );

    sendMessageToParent({
      type: "RESIZE_FLOAT_PANEL",
      orientation: currentState.orientation,
      isCollapsed: currentState.isCollapsed,
      width: width,
      height: height,
    });

  }, [panelRef, calculatePanelDimensions]);

  const sendOrientationMessage = useCallback(() => {

    const currentState = currentStateRef.current;

    sendMessageToParent({
      type: "ORIENTATION_CHANGE_FLOAT_PANEL",
      orientation: currentState.orientation,
      isCollapsed: currentState.isCollapsed,
    });

  }, []);

  useEffect(() => {
    if (!panelRef.current) return;
    sendResizeMessage();
  }, [panelRef, sendResizeMessage]);

  // Update ref when state changes
  useEffect(() => {
    currentStateRef.current = { orientation, isCollapsed, state, error };
  }, [orientation, isCollapsed, state, error]);

  useEffect(() => {
    requestAnimationFrame(() => {
      sendResizeMessage();
    });
  }, [state, error, sendResizeMessage]);

  return {
    sendResizeMessage,
    sendOrientationMessage,
  };
};
