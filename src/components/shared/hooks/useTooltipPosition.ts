import { useState, useEffect, useRef } from "react";

export type TooltipPosition = "left" | "right" | "top" | "bottom";

interface UseTooltipPositionProps {
  panelOrientation: "vertical" | "horizontal";
  panelRef: React.RefObject<HTMLElement>;
}

export const useTooltipPosition = ({
  panelOrientation,
  panelRef,
}: UseTooltipPositionProps) => {
  const [tooltipPosition, setTooltipPosition] =
    useState<TooltipPosition>("right");

  useEffect(() => {
    const updateTooltipPosition = () => {
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
    };

    // Оновлюємо позицію при зміні розміру вікна або позиції панелі
    updateTooltipPosition();

    const handleResize = () => updateTooltipPosition();
    const handleScroll = () => updateTooltipPosition();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);

    // Також слухаємо зміни позиції панелі через MutationObserver
    const observer = new MutationObserver(updateTooltipPosition);
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
  }, [panelOrientation, panelRef]);

  return tooltipPosition;
};
