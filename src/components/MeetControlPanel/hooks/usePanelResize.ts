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
        // Collapsed state: 50x54
        width = 50;
        height = 54;
      } else {
        // Expanded state - determine height based on buttons count
        if (state === "idle") {
          // One button (error button): 50x107
          height = 107;
        } else if ((state === "recording" || state === "paused") && !error) {
          // Three buttons: 50x195
          height = 195;
        } else {
          // Default case: 50x151
          height = 151;
        }
        width = 50;
      }

      // For horizontal orientation, swap width and height
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

    console.log("Panel resize message sent:", {
      orientation: currentState.orientation,
      isCollapsed: currentState.isCollapsed,
      state: currentState.state,
      error: currentState.error,
      width: width,
      height: height,
    });
  }, [panelRef, calculatePanelDimensions]);

  const sendOrientationMessage = useCallback(() => {
    // Simply send orientation change message without dimensions
    // Content script will swap width and height automatically
    const currentState = currentStateRef.current;

    sendMessageToParent({
      type: "ORIENTATION_CHANGE_FLOAT_PANEL",
      orientation: currentState.orientation,
      isCollapsed: currentState.isCollapsed,
    });

    console.log("Panel orientation message sent:", {
      orientation: currentState.orientation,
      isCollapsed: currentState.isCollapsed,
    });
  }, []);

  useEffect(() => {
    if (!panelRef.current) return;

    // Create ResizeObserver to watch for size changes
    // resizeObserverRef.current = new ResizeObserver((entries) => {
    //   for (const entry of entries) {
    //     // Debounce resize messages to avoid too many updates
    //     if (debounceTimeoutRef.current) {
    //       clearTimeout(debounceTimeoutRef.current);
    //     }
    //     debounceTimeoutRef.current = setTimeout(() => {
    //       sendResizeMessage();
    //     }, 100);
    //   }
    // });

    // // Start observing the panel element
    // resizeObserverRef.current.observe(panelRef.current);

    // Send initial size message
    sendResizeMessage();

    // Cleanup
    // return () => {
    //   if (resizeObserverRef.current) {
    //     resizeObserverRef.current.disconnect();
    //   }
    //   if (debounceTimeoutRef.current) {
    //     clearTimeout(debounceTimeoutRef.current);
    //   }
    // };
  }, [panelRef, sendResizeMessage]);

  // Update ref when state changes
  useEffect(() => {
    currentStateRef.current = { orientation, isCollapsed, state, error };
  }, [orientation, isCollapsed, state, error]);

  // Send resize message when state, error, orientation, or collapsed state changes
  useEffect(() => {
    // Send resize message after DOM update to recalculate dimensions
    requestAnimationFrame(() => {
      sendResizeMessage();
    });
  }, [state, error, sendResizeMessage]);

  return {
    sendResizeMessage,
    sendOrientationMessage,
  };
};
