import { cva } from "class-variance-authority";

export const panelVariants = cva("rounded-lg border transition-colors", {
  variants: {
    variant: {
      default: "bg-card border-border",
      outline: "bg-background border-border",
      filled: "bg-muted border-muted",
      warning: "bg-warning-muted border-warning/20",
      danger: "bg-destructive-muted border-destructive/20",
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
