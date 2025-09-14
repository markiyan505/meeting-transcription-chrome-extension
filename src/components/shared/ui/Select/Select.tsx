import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/components/shared/lib/utils";
import { SelectProps } from "./Select.types";
import { selectVariants, helperTextVariants } from "./select-variants";

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      size = "default",
      variant = "default",
      className,
      disabled = false,
      error = false,
      helperText,
      options,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onChange) {
        onChange(e.target.value);
      }
    };

    return (
      <div className="w-full">
        <div className="relative">
          <select
            ref={ref}
            disabled={disabled}
            value={value}
            onChange={handleChange}
            className={cn(
              selectVariants({
                size,
                variant,
                disabled,
                error,
              }),
              "pr-8", // Space for chevron
              className
            )}
            {...props}
          >
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {helperText && (
          <div className={cn(helperTextVariants({ error }))}>{helperText}</div>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
