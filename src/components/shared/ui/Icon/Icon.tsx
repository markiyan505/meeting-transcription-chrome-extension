import * as React from "react";
import { cn } from "@/components/shared/lib/utils";
import { Tooltip } from "../tooltip/Tooltip";
import { IconProps } from "./Icon.types";
import { iconVariants } from "./icon-variants";

const Icon = React.forwardRef<HTMLDivElement, IconProps>(
  (
    {
      icon: IconComponent,
      size = "default",
      color = "default",
      className,
      tooltip,
      tooltipPosition = "top",
      tooltipDelay = 500,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled;

    const iconElement = (
      <div
        ref={ref}
        className={cn(
          iconVariants({
            size,
            color,
            disabled: isDisabled,
          }),
          className
        )}
        {...props}
      >
        <IconComponent />
      </div>
    );

    if (tooltip && !isDisabled) {
      return (
        <Tooltip
          content={tooltip}
          position={tooltipPosition}
          delay={tooltipDelay}
        >
          <span className="flex items-center justify-center">
          {iconElement}
          </span>
        </Tooltip>
      );
    }

    return iconElement;
  }
);
Icon.displayName = "Icon";

export { Icon };
