import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/components/shared/lib/utils";
import { StatusIndicatorProps } from "./StatusIndicator.types";

const statusIndicatorVariants = cva("flex items-center space-x-2 text-xs", {
  variants: {
    status: {
      success: "text-green-500",
      error: "text-red-500",
      warning: "text-yellow-500",
      info: "text-blue-500",
      neutral: "text-gray-500",
    },
  },
  defaultVariants: {
    status: "neutral",
  },
});

const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ className, status, icon, label, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(statusIndicatorVariants({ status, className }))}
        {...props}
      >
        {icon}
        {label && <span>{label}</span>}
      </div>
    );
  }
);
StatusIndicator.displayName = "StatusIndicator";

export { StatusIndicator, statusIndicatorVariants };
