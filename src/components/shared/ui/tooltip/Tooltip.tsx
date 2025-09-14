import * as React from "react";
import { cn } from "@/components/shared/lib/utils";
import {
  TooltipProps,
  TooltipTriggerProps,
  TooltipContentProps,
  TooltipProviderProps,
} from "./Tooltip.types";

// Tooltip Provider
const TooltipProvider = React.forwardRef<HTMLDivElement, TooltipProviderProps>(
  (
    {
      children,
      delayDuration = 700,
      skipDelayDuration = 300,
      disableHoverableContent = false,
    },
    ref
  ) => {
    return (
      <div ref={ref} data-tooltip-provider>
        {children}
      </div>
    );
  }
);
TooltipProvider.displayName = "TooltipProvider";

// Tooltip Root
const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      children,
      content,
      position = "top",
      delay = 1000,
      disabled = false,
      className,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);
    const timeoutRef = React.useRef<NodeJS.Timeout>();
    const triggerRef = React.useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
      if (disabled || !content) return;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setIsOpen(true);
      }, delay);
    };

    const handleMouseLeave = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (!isHovered) {
          setIsOpen(false);
        }
      }, 100);
    };

    const handleTooltipMouseEnter = () => {
      setIsHovered(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };

    const handleTooltipMouseLeave = () => {
      setIsHovered(false);
      setIsOpen(false);
    };

    React.useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    React.useEffect(() => {
      if (!content || disabled) {
        setIsOpen(false);
        setIsHovered(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      }
    }, [content, disabled]);

    const getTooltipClasses = () => {
      const baseClasses = `absolute px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-[9999] pointer-events-none transition-opacity duration-200 ${
        isOpen || isHovered ? "opacity-100" : "opacity-0"
      }`;

      switch (position) {
        case "left":
          return `${baseClasses} right-full top-1/2 transform -translate-y-1/2 mr-2`;
        case "right":
          return `${baseClasses} left-full top-1/2 transform -translate-y-1/2 ml-2`;
        case "top":
          return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
        case "bottom":
          return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 mt-2`;
        default:
          return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
      }
    };

    const getArrowClasses = () => {
      const baseArrow = "absolute w-0 h-0";

      switch (position) {
        case "left":
          return `${baseArrow} left-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-900`;
        case "right":
          return `${baseArrow} right-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900`;
        case "top":
          return `${baseArrow} top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900`;
        case "bottom":
          return `${baseArrow} bottom-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900`;
        default:
          return `${baseArrow} top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900`;
      }
    };


    return (
      <div
        ref={ref}
        className={cn("relative inline-flex items-center", className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div ref={triggerRef}>{children}</div>
        {content && !disabled && (
          <div
            className={getTooltipClasses()}
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
          >
            {content}
            <div className={getArrowClasses()}></div>
          </div>
        )}
      </div>
    );
  }
);
Tooltip.displayName = "Tooltip";

// Tooltip Trigger
const TooltipTrigger = React.forwardRef<HTMLDivElement, TooltipTriggerProps>(
  ({ children, className }, ref) => {
    return (
      <div ref={ref} className={cn("inline-block", className)}>
        {children}
      </div>
    );
  }
);
TooltipTrigger.displayName = "TooltipTrigger";

// Tooltip Content
const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "absolute px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-[9999] pointer-events-none transition-opacity duration-200",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent };
