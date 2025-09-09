import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/components/lib/utils";

const meetPanelVariants = cva(
  "flex flex-col bg-white border border-gray-200 rounded-sm shadow-lg backdrop-blur-sm",
  {
    variants: {
      orientation: {
        vertical: "w-[50px]",
        horizontal: "h-[50px] flex-row",
      },
      padding: {
        default: "p-1",
      },
    },
    defaultVariants: {
      orientation: "vertical",
      padding: "default",
    },
  }
);

export interface MeetPanelProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof meetPanelVariants> {
  orientation?: "vertical" | "horizontal";
}

const MeetPanel = React.forwardRef<HTMLDivElement, MeetPanelProps>(
  ({ className, orientation, padding, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(meetPanelVariants({ orientation, padding, className }))}
        {...props}
      />
    );
  }
);
MeetPanel.displayName = "MeetPanel";

export { MeetPanel, meetPanelVariants };
