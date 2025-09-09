import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/components/lib/utils";

const meetButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative group",
  {
    variants: {
      variant: {
        default:
          "bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900",
        primary: "bg-blue-600 hover:bg-blue-700 text-white",
        danger: "bg-red-600 hover:bg-red-700 text-white",
        success: "bg-green-600 hover:bg-green-700 text-white",
        warning: "bg-yellow-500 hover:bg-yellow-600 text-white",
        ghost:
          "bg-transparent hover:bg-gray-100 text-gray-600 hover:text-gray-900",
      },
      size: {
        default: "h-10 w-10",
        sm: "h-5 w-5",
        lg: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface MeetButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof meetButtonVariants> {
  tooltip?: string;
  tooltipPosition?: "left" | "right" | "top" | "bottom";
  asChild?: boolean;
}

const MeetButton = React.forwardRef<HTMLButtonElement, MeetButtonProps>(
  (
    {
      className,
      variant,
      size,
      tooltip,
      tooltipPosition = "top",
      children,
      ...props
    },
    ref
  ) => {
    const [showTooltip, setShowTooltip] = React.useState(false);
    const [tooltipHovered, setTooltipHovered] = React.useState(false);
    const timeoutRef = React.useRef<NodeJS.Timeout>();

    const handleMouseEnter = () => {
      if (!tooltip) return;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setShowTooltip(true);
      }, 500);
    };

    const handleMouseLeave = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (!tooltipHovered) {
          setShowTooltip(false);
        }
      }, 100);
    };

    const handleTooltipMouseEnter = () => {
      setTooltipHovered(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };

    const handleTooltipMouseLeave = () => {
      setTooltipHovered(false);
      setShowTooltip(false);
    };

    React.useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    // Скидаємо tooltip коли він стає undefined
    React.useEffect(() => {
      if (!tooltip) {
        setShowTooltip(false);
        setTooltipHovered(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      }
    }, [tooltip]);

    const getTooltipClasses = () => {
      const baseClasses = `absolute px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-[9999] pointer-events-none transition-opacity duration-200 ${
        showTooltip || tooltipHovered ? "opacity-100" : "opacity-0"
      }`;

      switch (tooltipPosition) {
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

      switch (tooltipPosition) {
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
      <button
        className={cn(meetButtonVariants({ variant, size, className }))}
        ref={ref}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {children}
        {tooltip && (
          <div
            className={getTooltipClasses()}
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
          >
            {tooltip}
            <div className={getArrowClasses()}></div>
          </div>
        )}
      </button>
    );
  }
);
MeetButton.displayName = "MeetButton";

export { MeetButton, meetButtonVariants };
