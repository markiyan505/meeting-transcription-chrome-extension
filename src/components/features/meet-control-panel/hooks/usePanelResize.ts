import { useCallback, useEffect, useRef } from "react";
import { orientationType } from "../types";
import { StateType, ErrorType } from "@/types/session";

const sendMessageToParent = (message: any) => {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage(message, "*");
  }
};

interface UsePanelResizeProps {
  panelRef: React.RefObject<HTMLDivElement>;
  orientation: orientationType;
  isCollapsed: boolean;
  state: StateType;
  error: ErrorType;
}

export const usePanelResize = ({
  panelRef,
  orientation,
  isCollapsed,
  state,
  error,
}: UsePanelResizeProps) => {
  const currentStateRef = useRef({ orientation, isCollapsed, state, error });

  const calculatePanelDimensions = useCallback(
    (
      orientation: orientationType,
      isCollapsed: boolean,
      state: StateType,
      error: ErrorType
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

    const currentState = currentStateRef.current;

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
