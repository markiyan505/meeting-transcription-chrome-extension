import React, { useState, useCallback, useEffect } from "react";

interface DevContainerProps {
  children: React.ReactNode;
}

// Constants for minimum sizes
const MIN_WIDTH = 216;
const MIN_HEIGHT = 116;

const DevContainer: React.FC<DevContainerProps> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(true); // Показувати від початку
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [size, setSize] = useState({ width: 416, height: 316 });

  // Drag & Drop state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({
    x: 0,
    y: 0,
    elementX: 0,
    elementY: 0,
  });

  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    elementX: 0,
    elementY: 0,
  });
  const [resizeHandle, setResizeHandle] = useState("");

  const handleShow = useCallback(() => {
    setIsVisible(true);
  }, []);

  const handleHide = useCallback(() => {
    setIsVisible(false);
  }, []);

  const handleToggleMinimize = useCallback(() => {
    const newMinimizedState = !isMinimized;
    setIsMinimized(newMinimizedState);

    const newHeight = newMinimizedState ? 56 : 316;
    setSize((prev) => ({ ...prev, height: newHeight }));


  }, [isMinimized]);

  const handleMove = useCallback((x: number, y: number) => {
    setPosition({ x, y });
  }, []);

  const handleResize = useCallback((width: number, height: number) => {
    setSize({ width, height });
  }, []);

  const handleReset = useCallback(() => {
    setPosition({ x: 20, y: 20 });
    setSize({ width: 416, height: 316 });
    setIsMinimized(false);
  }, []);

  // Drag & Drop handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isResizing) return;

      setIsDragging(true);
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        elementX: position.x,
        elementY: position.y,
      });

      e.preventDefault();
      e.stopPropagation();
    },
    [isResizing, position]
  );

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, handle: string) => {
      if (isDragging) return;

      setIsResizing(true);
      setResizeHandle(handle);
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: size.width,
        height: size.height,
        elementX: position.x,
        elementY: position.y,
      });

      e.preventDefault();
      e.stopPropagation();
    },
    [isDragging, size, position]
  );

  // Global mouse move handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;

        const newX = Math.max(
          0,
          Math.min(dragStart.elementX + deltaX, window.innerWidth - size.width)
        );
        const newY = Math.max(
          0,
          Math.min(
            dragStart.elementY + deltaY,
            window.innerHeight - size.height
          )
        );

        // Використовуємо requestAnimationFrame для плавності
        requestAnimationFrame(() => {
          setPosition({ x: newX, y: newY });
        });
      }

      if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;

        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;
        let newX = resizeStart.elementX;
        let newY = resizeStart.elementY;

        const minWidth = MIN_WIDTH;
        const minHeight = MIN_HEIGHT;

        // Handle horizontal resizing
        if (resizeHandle.includes("w")) {
          const proposedWidth = resizeStart.width - deltaX;
          const proposedX = resizeStart.elementX + deltaX;

          // Check minimum width constraint
          if (proposedWidth < minWidth) {
            newWidth = minWidth;
            newX = resizeStart.elementX + resizeStart.width - minWidth;
          } else if (proposedX >= 0) {
            newWidth = proposedWidth;
            newX = proposedX;
          } else {
            // Hit left boundary, expand from current position
            newWidth = resizeStart.width + resizeStart.elementX;
            newX = 0;
          }
        } else if (resizeHandle.includes("e")) {
          const proposedWidth = resizeStart.width + deltaX;

          // Check minimum width constraint
          if (proposedWidth < minWidth) {
            newWidth = minWidth;
          } else if (
            resizeStart.elementX + proposedWidth <=
            window.innerWidth
          ) {
            newWidth = proposedWidth;
          } else {
            // Hit right boundary
            newWidth = window.innerWidth - resizeStart.elementX;
          }
        }

        // Handle vertical resizing
        if (resizeHandle.includes("n")) {
          const proposedHeight = resizeStart.height - deltaY;
          const proposedY = resizeStart.elementY + deltaY;

          // Check minimum height constraint
          if (proposedHeight < minHeight) {
            newHeight = minHeight;
            newY = resizeStart.elementY + resizeStart.height - minHeight;
          } else if (proposedY >= 0) {
            newHeight = proposedHeight;
            newY = proposedY;
          } else {
            // Hit top boundary, expand from current position
            newHeight = resizeStart.height + resizeStart.elementY;
            newY = 0;
          }
        } else if (resizeHandle.includes("s")) {
          const proposedHeight = resizeStart.height + deltaY;

          // Check minimum height constraint
          if (proposedHeight < minHeight) {
            newHeight = minHeight;
          } else if (
            resizeStart.elementY + proposedHeight <=
            window.innerHeight
          ) {
            newHeight = proposedHeight;
          } else {
            // Hit bottom boundary
            newHeight = window.innerHeight - resizeStart.elementY;
          }
        }

        // Використовуємо requestAnimationFrame для плавності
        requestAnimationFrame(() => {
          setSize({ width: newWidth, height: newHeight });
          setPosition({ x: newX, y: newY });

          // Логування для відладки
          if (
            newWidth !== resizeStart.width ||
            newHeight !== resizeStart.height
          ) {

          }
        });
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        console.log(

        );
      }

      if (isResizing) {
        setIsResizing(false);
        setResizeHandle("");
        console.log(

        );
      }
    };

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [
    isDragging,
    isResizing,
    dragStart,
    resizeStart,
    resizeHandle,
    position,
    size,
  ]);

  // Listen for messages from iframe (simulate content script behavior)


  // Expose methods to global scope for dev controls
  useEffect(() => {
    (window as any).devControls = {
      show: handleShow,
      hide: handleHide,
      toggleMinimize: handleToggleMinimize,
      move: handleMove,
      resize: handleResize,
      reset: handleReset,
      getState: () => ({
        isVisible,
        isMinimized,
        position,
        size,
      }),
    };
  }, [
    handleShow,
    handleHide,
    handleToggleMinimize,
    handleMove,
    handleResize,
    handleReset,
    isVisible,
    isMinimized,
    position,
    size,
  ]);

  if (!isVisible) {
    return null;
  }

  // Resize handles
  const resizeHandles = ["nw", "n", "ne", "w", "e", "sw", "s", "se"];

  const getResizeHandleStyle = (handle: string) => {
    const baseStyle =
      "resize-handle absolute bg-transparent z-[1000001] transition-colors hover:bg-blue-300/30";
    const styles: { [key: string]: string } = {
      nw: `${baseStyle} top-0 left-0 w-2 h-2 cursor-nw-resize`,
      n: `${baseStyle} top-0 left-2 right-2 h-2 cursor-n-resize`,
      ne: `${baseStyle} top-0 right-0 w-2 h-2 cursor-ne-resize`,
      w: `${baseStyle} top-2 left-0 w-2 bottom-2 cursor-w-resize`,
      e: `${baseStyle} top-2 right-0 w-2 bottom-2 cursor-e-resize`,
      sw: `${baseStyle} bottom-0 left-0 w-2 h-2 cursor-sw-resize`,
      s: `${baseStyle} bottom-0 left-2 right-2 h-2 cursor-s-resize`,
      se: `${baseStyle} bottom-0 right-0 w-2 h-2 cursor-se-resize`,
    };
    return styles[handle] || baseStyle;
  };

  return (
    <div
      className={`dev-container fixed z-[999999] bg-black border-none rounded-lg shadow-lg ${
        isDragging ? "dragging" : ""
      } ${isResizing ? "resizing" : ""} ${
        isDragging || isResizing ? "" : "transition-all duration-300"
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        transform: isMinimized ? "none" : "translateZ(0)",
        willChange:
          isDragging || isResizing ? "left, top, width, height" : "auto",
      }}
    >
      {/* Resize Handles */}
      {resizeHandles.map((handle) => (
        <div
          key={handle}
          className={getResizeHandleStyle(handle)}
          onMouseDown={(e) => handleResizeMouseDown(e, handle)}
        />
      ))}

      {/* Drag Handle */}
      <div
        className="drag-handle absolute top-2 left-2 right-20 h-10 z-[1000000] cursor-move bg-transparent transition-colors hover:bg-blue-100/10"
        style={{
          borderRadius: "4px",
          transform: "translateZ(0)",
        }}
        onMouseDown={handleMouseDown}
      />

      {/* Content */}
      <div
        className={`dev-content w-full h-full bg-white rounded shadow-md pointer-events-auto m-2 ${
          isDragging ? "dragging" : ""
        } ${isResizing ? "resizing" : ""} ${
          isDragging || isResizing ? "" : "transition-all duration-300"
        }`}
        style={{
          width: "calc(100% - 16px)",
          height: "calc(100% - 16px)",
          transform: "translateZ(0)",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default DevContainer;
