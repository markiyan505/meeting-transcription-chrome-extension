import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/components/shared/lib/utils";
import {
  DropdownSelectProps,
  DropdownSelectOption,
} from "./DropdownSelect.types";
import {
  dropdownTriggerVariants,
  dropdownMenuVariants,
  dropdownOptionVariants,
  dropdownChevronVariants,
  dropdownHelperVariants,
} from "./dropdown-variants";

const DropdownSelect = React.forwardRef<HTMLDivElement, DropdownSelectProps>(
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
      placeholder = "Select an option...",
      id,
      name,
      required = false,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [focusedIndex, setFocusedIndex] = React.useState(-1);
    const selectRef = React.useRef<HTMLDivElement>(null);
    const optionRefs = React.useRef<(HTMLDivElement | null)[]>([]);

    const selectedOption = options.find((option) => option.value === value);

    const handleToggle = () => {
      if (!disabled) {
        setIsOpen(!isOpen);
        setFocusedIndex(-1);
      }
    };

    const handleSelect = (option: DropdownSelectOption) => {
      if (!option.disabled && onChange) {
        onChange(option.value);
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case "Enter":
        case " ":
          e.preventDefault();
          if (isOpen && focusedIndex >= 0) {
            handleSelect(options[focusedIndex]);
          } else {
            handleToggle();
          }
          break;
        case "Escape":
          setIsOpen(false);
          setFocusedIndex(-1);
          break;
        case "ArrowDown":
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            const nextIndex = Math.min(focusedIndex + 1, options.length - 1);
            setFocusedIndex(nextIndex);
            optionRefs.current[nextIndex]?.scrollIntoView({
              block: "nearest",
            });
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            const prevIndex = Math.max(focusedIndex - 1, 0);
            setFocusedIndex(prevIndex);
            optionRefs.current[prevIndex]?.scrollIntoView({
              block: "nearest",
            });
          }
          break;
      }
    };

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          selectRef.current &&
          !selectRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
          setFocusedIndex(-1);
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
          document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [isOpen]);

    const triggerClasses = cn(
      dropdownTriggerVariants({
        size,
        variant,
        disabled,
        error: error && !disabled,
        isOpen: isOpen && !disabled,
      }),
      className
    );

    const dropdownClasses = dropdownMenuVariants({
      isOpen,
    });

    const optionClasses = dropdownOptionVariants({
      size,
    });

    const chevronClasses = dropdownChevronVariants({
      isOpen,
      disabled,
    });

    const helperClasses = dropdownHelperVariants({
      error,
    });

    return (
      <div className="w-full" ref={ref}>
        <div className="relative" ref={selectRef}>
          <div
            className={triggerClasses}
            onClick={handleToggle}
            onKeyDown={handleKeyDown}
            tabIndex={disabled ? -1 : 0}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            id={id}
            data-name={name}
            aria-required={required}
          >
            <span
              className={cn("truncate", {
                "text-muted-foreground": !selectedOption,
              })}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronDown className={chevronClasses} />
          </div>

          <div className={dropdownClasses}>
            <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/50">
              {options.map((option, index) => (
                <div
                  key={option.value}
                  ref={(el) => (optionRefs.current[index] = el)}
                  className={cn(
                    optionClasses,
                    dropdownOptionVariants({
                      size,
                      isSelected: option.value === value,
                      isDisabled: option.disabled,
                    })
                  )}
                  onClick={() => handleSelect(option)}
                  role="option"
                  aria-selected={option.value === value}
                >
                  <span className="truncate">{option.label}</span>
                  {option.value === value && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {helperText && <div className={helperClasses}>{helperText}</div>}
      </div>
    );
  }
);

DropdownSelect.displayName = "DropdownSelect";

export { DropdownSelect };
