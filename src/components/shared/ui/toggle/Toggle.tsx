import * as React from "react";
import { cn } from "@/components/shared/lib/utils";
import { ToggleProps } from "./Toggle.types";
import { toggleVariants, thumbVariants } from "./toggle-variants";

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  (
    {
      className,
      variant,
      size,
      checked,
      defaultChecked = false,
      onChange,
      disabled,
      label,
      description,
      ...props
    },
    ref
  ) => {
    const [isChecked, setIsChecked] = React.useState(defaultChecked);
    const isActive = checked !== undefined ? checked : isChecked;

    const handleToggle = () => {
      if (disabled) return;

      const newChecked = !isActive;
      setIsChecked(newChecked);
      onChange?.(newChecked);
    };

    return (
      <div className="flex items-center space-x-3">
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={isActive}
          aria-label={label}
          disabled={disabled}
          onClick={handleToggle}
          data-state={isActive ? "on" : "off"}
          className={cn(
            toggleVariants({ variant, size }),
            "rounded-full",
            className
          )}
          {...props}
        >
          <span
            className={cn(
              thumbVariants({ size, variant }),
              isActive
                ? size === "sm"
                  ? "translate-x-5"
                  : size === "lg"
                  ? "translate-x-7"
                  : "translate-x-6"
                : "translate-x-1"
            )}
          />
        </button>

        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);
Toggle.displayName = "Toggle";

export { Toggle };
