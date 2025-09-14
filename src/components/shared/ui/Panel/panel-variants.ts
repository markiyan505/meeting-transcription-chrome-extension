import { cva } from "class-variance-authority";

export const panelVariants = cva("rounded-lg border transition-colors", {
  variants: {
    variant: {
      default: "bg-card border-border",
      outline: "bg-background border-border",
      filled: "bg-muted border-muted",
      warning:
        "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800",
      danger: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
    },
    size: {
      sm: "p-2",
      default: "p-3",
      lg: "p-4",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});
