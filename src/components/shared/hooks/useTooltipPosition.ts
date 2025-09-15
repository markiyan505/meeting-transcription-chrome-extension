import { useState, useEffect, useRef, useCallback } from "react";

export type TooltipPosition = "left" | "right" | "top" | "bottom";

interface UseTooltipPositionProps {
  panelOrientation: "vertical" | "horizontal";
  panelRef: React.RefObject<HTMLElement>;
  debounceMs?: number;
}

const useDebounce = (callback: () => void, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(callback, delay);
  }, [callback, delay]);
};

export const useTooltipPosition = ({
  panelOrientation,
  panelRef,
  debounceMs = 150,
}: UseTooltipPositionProps) => {
  const [tooltipPosition, setTooltipPosition] =
    useState<TooltipPosition>("right");

  const updateTooltipPosition = useCallback(() => {
    if (!panelRef.current) return;

    const panelRect = panelRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const distanceToLeft = panelRect.left;
    const distanceToRight = viewportWidth - panelRect.right;
    const distanceToTop = panelRect.top;
    const distanceToBottom = viewportHeight - panelRect.bottom;

    if (panelOrientation === "vertical") {
      if (distanceToRight > 120) {
        setTooltipPosition("right");
      } else if (distanceToLeft > 120) {
        setTooltipPosition("left");
      } else if (distanceToRight > distanceToLeft) {
        setTooltipPosition("right");
      } else {
        setTooltipPosition("left");
      }
    } else {
      if (distanceToBottom > 40) {
        setTooltipPosition("bottom");
      } else if (distanceToTop > 40) {
        setTooltipPosition("top");
      } else if (distanceToBottom > distanceToTop) {
        setTooltipPosition("bottom");
      } else {
        setTooltipPosition("top");
      }
    }
  }, [panelOrientation, panelRef]);

  const debouncedUpdateTooltipPosition = useDebounce(
    updateTooltipPosition,
    debounceMs
  );

  useEffect(() => {
    updateTooltipPosition();

    const handleResize = debouncedUpdateTooltipPosition;
    const handleScroll = debouncedUpdateTooltipPosition;

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, { passive: true });

    const observer = new MutationObserver(debouncedUpdateTooltipPosition);
    if (panelRef.current) {
      observer.observe(panelRef.current, {
        attributes: true,
        attributeFilter: ["style", "class"],
      });
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, [updateTooltipPosition, debouncedUpdateTooltipPosition, panelRef]);

  return tooltipPosition;
};
