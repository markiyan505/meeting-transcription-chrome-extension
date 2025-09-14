import { cva } from "class-variance-authority";

export const iconVariants = cva(
  "inline-flex items-center justify-center transition-colors",
  {
    variants: {
      size: {
        sm: "w-3 h-3",
        default: "w-4 h-4",
        lg: "w-5 h-5",
        xl: "w-10 h-10",
      },
      color: {
        default: "text-foreground",
        primary: "text-primary",
        success: "text-success",
        warning: "text-warning",
        destructive: "text-destructive",
        muted: "text-muted-foreground",
        accent: "text-accent-foreground",
      },
      disabled: {
        true: "opacity-50",
        false: "",
      },
    },
    defaultVariants: {
      size: "default",
      color: "default",
      disabled: false,
    },
  }
);
