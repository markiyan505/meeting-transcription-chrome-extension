import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/components/shared/lib/utils";
import { StatusIndicatorProps } from "./StatusIndicator.types";

const statusIndicatorVariants = cva("flex items-center space-x-2 text-xs", {
  variants: {
    status: {
      success: "text-success",
      error: "text-destructive",
      warning: "text-warning",
      info: "text-info",
      neutral: "text-muted-foreground",
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
