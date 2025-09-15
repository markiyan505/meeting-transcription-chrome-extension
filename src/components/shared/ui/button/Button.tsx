import * as React from "react";
import { cn } from "@/components/shared/lib/utils";
import { ButtonProps } from "./Button.types";
import { Tooltip } from "../tooltip/Tooltip";
import { buttonVariants } from "./button-variants";

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      shape,
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      tooltip,
      tooltipPosition = "top",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const buttonContent = (
      <>
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}

        {!loading && leftIcon && <span>{leftIcon}</span>}

        {loading ? loadingText || "Loading..." : children}

        {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </>
    );

    const buttonElement = (
      <button
        className={cn(buttonVariants({ variant, size, shape, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {buttonContent}
      </button>
    );

    if (tooltip && !isDisabled) {
      return (
        <Tooltip content={tooltip} position={tooltipPosition}>
          {buttonElement}
        </Tooltip>
      );
    }

    return buttonElement;
  }
);
Button.displayName = "Button";

export { Button };
