import * as React from "react";
import { cn } from "@/components/shared/lib/utils";
import { InputProps } from "./Input.types";
import { inputVariants, helperTextVariants } from "./input-variants";

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = "default",
      variant = "default",
      className,
      disabled = false,
      loading = false,
      leftIcon,
      rightIcon,
      error = false,
      helperText,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const hasLeftIcon = !!leftIcon;
    const hasRightIcon = !!rightIcon || loading;

    return (
      <div className="w-full">
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {React.createElement(leftIcon, {
                className: cn(
                  size === "sm"
                    ? "w-3 h-3"
                    : size === "lg"
                    ? "w-5 h-5"
                    : "w-4 h-4",
                  isDisabled && "opacity-50"
                ),
              })}
            </div>
          )}
          <input
            ref={ref}
            disabled={isDisabled}
            className={cn(
              inputVariants({
                size,
                variant,
                disabled: isDisabled,
                error,
                hasLeftIcon,
                hasRightIcon,
              }),
              className
            )}
            {...props}
          />
          {rightIcon && !loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {React.createElement(rightIcon, {
                className: cn(
                  size === "sm"
                    ? "w-3 h-3"
                    : size === "lg"
                    ? "w-5 h-5"
                    : "w-4 h-4",
                  isDisabled && "opacity-50"
                ),
              })}
            </div>
          )}
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        {helperText && (
          <div className={cn(helperTextVariants({ error }))}>{helperText}</div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
