import { cva } from "class-variance-authority";

export const selectVariants = cva(
  "w-full bg-card border border-border rounded-lg px-4 py-2 text-sm transition-colors focus:ring-2 focus:ring-ring focus:outline-none appearance-none cursor-pointer",
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
        true: "opacity-50 cursor-not-allowed",
        false: "",
      },
      error: {
        true: "border-red-500 focus:ring-red-500",
        false: "",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
      disabled: false,
      error: false,
    },
  }
);

export const selectIconVariants = cva(
  "absolute top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none w-4 h-4",
  {
    variants: {
      position: {
        left: "left-3",
        right: "right-3",
      },
      disabled: {
        true: "opacity-50",
        false: "",
      },
    },
    defaultVariants: {
      position: "left",
      disabled: false,
    },
  }
);

export const helperTextVariants = cva("text-xs mt-1", {
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
