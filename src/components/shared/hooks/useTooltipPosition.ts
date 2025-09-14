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

    // Визначаємо відстані до країв екрана
    const distanceToLeft = panelRect.left;
    const distanceToRight = viewportWidth - panelRect.right;
    const distanceToTop = panelRect.top;
    const distanceToBottom = viewportHeight - panelRect.bottom;

    if (panelOrientation === "vertical") {
      // Для вертикальної панелі тултіпи збоку
      if (distanceToRight > 120) {
        // Є місце справа
        setTooltipPosition("right");
      } else if (distanceToLeft > 120) {
        // Є місце зліва
        setTooltipPosition("left");
      } else if (distanceToRight > distanceToLeft) {
        // Більше місця справа
        setTooltipPosition("right");
      } else {
        // Більше місця зліва
        setTooltipPosition("left");
      }
    } else {
      // Для горизонтальної панелі тултіпи зверху/знизу
      if (distanceToBottom > 40) {
        // Є місце знизу
        setTooltipPosition("bottom");
      } else if (distanceToTop > 40) {
        // Є місце зверху
        setTooltipPosition("top");
      } else if (distanceToBottom > distanceToTop) {
        // Більше місця знизу
        setTooltipPosition("bottom");
      } else {
        // Більше місця зверху
        setTooltipPosition("top");
      }
    }
  }, [panelOrientation, panelRef]);

  // Дебаунсована версія функції оновлення
  const debouncedUpdateTooltipPosition = useDebounce(
    updateTooltipPosition,
    debounceMs
  );

  useEffect(() => {
    // Оновлюємо позицію одразу при ініціалізації
    updateTooltipPosition();

    // Дебаунсовані обробники для scroll та resize
    const handleResize = debouncedUpdateTooltipPosition;
    const handleScroll = debouncedUpdateTooltipPosition;

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Також слухаємо зміни позиції панелі через MutationObserver
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
