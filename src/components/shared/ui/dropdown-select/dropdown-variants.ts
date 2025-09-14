import { cva } from "class-variance-authority";

export const dropdownTriggerVariants = cva(
  "w-full bg-card border border-border rounded-lg px-4 py-2 text-sm transition-all duration-200 focus:ring-2 focus:ring-ring focus:outline-none cursor-pointer flex items-center justify-between hover:border-ring/50 focus:border-ring motion-reduce:transition-none",
  {
    variants: {
      size: {
        sm: "px-3 py-1.5 text-sm",
        default: "px-4 py-2 text-sm",
        lg: "px-4 py-3 text-base",
      },
      variant: {
        default: "border-border",
        outline: "border-border bg-background",
        filled: "border-muted bg-muted",
      },
      disabled: {
        true: "opacity-50 cursor-not-allowed hover:border-border",
        false: "",
      },
      error: {
        true: "border-red-500 focus:ring-red-500 hover:border-red-600",
        false: "",
      },
      isOpen: {
        true: "ring-2 ring-ring border-ring",
        false: "",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
      disabled: false,
      error: false,
      isOpen: false,
    },
  }
);

export const dropdownMenuVariants = cva(
  "absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-xl overflow-hidden transition-all duration-200 ease-out motion-reduce:transition-none",
  {
    variants: {
      isOpen: {
        true: "opacity-100 visible scale-100 translate-y-0 pointer-events-auto",
        false:
          "opacity-0 invisible scale-95 translate-y-[-10px] pointer-events-none",
      },
    },
    defaultVariants: {
      isOpen: false,
    },
  }
);

export const dropdownOptionVariants = cva(
  "px-4 py-2 text-sm cursor-pointer transition-all duration-150 flex items-center justify-between hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none motion-reduce:transition-none",
  {
    variants: {
      size: {
        sm: "px-3 py-1.5 text-sm",
        default: "px-4 py-2 text-sm",
        lg: "px-4 py-3 text-base",
      },
      isSelected: {
        true: "bg-accent text-accent-foreground font-medium",
        false: "",
      },
      isDisabled: {
        true: "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-current",
        false: "",
      },
    },
    defaultVariants: {
      size: "default",
      isSelected: false,
      isDisabled: false,
    },
  }
);

export const dropdownChevronVariants = cva(
  "w-4 h-4 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
  {
    variants: {
      isOpen: {
        true: "rotate-180",
        false: "",
      },
      disabled: {
        true: "opacity-50",
        false: "",
      },
    },
    defaultVariants: {
      isOpen: false,
      disabled: false,
    },
  }
);

export const dropdownHelperVariants = cva("text-xs mt-1", {
  variants: {
    error: {
      true: "text-red-500",
      false: "text-muted-foreground",
    },
  },
  defaultVariants: {
    error: false,
  },
});
