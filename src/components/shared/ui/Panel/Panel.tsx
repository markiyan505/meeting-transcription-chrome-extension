import * as React from "react";
import { cn } from "@/components/shared/lib/utils";
import { PanelProps } from "./Panel.types";
import { panelVariants } from "./panel-variants";

const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  (
    { children, variant = "default", size = "default", className, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(panelVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Panel.displayName = "Panel";

export { Panel };
