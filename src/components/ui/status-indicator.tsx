import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/components/lib/utils";

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

export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusIndicatorVariants> {
  icon: React.ReactNode;
  label: string;
}

const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ className, status, icon, label, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(statusIndicatorVariants({ status, className }))}
        {...props}
      >
        {icon}
        <span>{label}</span>
      </div>
    );
  }
);
StatusIndicator.displayName = "StatusIndicator";

export { StatusIndicator, statusIndicatorVariants };
