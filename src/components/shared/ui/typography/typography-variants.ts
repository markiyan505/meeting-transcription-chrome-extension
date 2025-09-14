import { cva } from "class-variance-authority";

export const typographyVariants = cva("", {
  variants: {
    variant: {
      heading: "text-xs font-semibold",
      title: "text-sm font-medium",
      caption: "text-xs",
      stat: "text-md font-semibold",
    },
    color: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      primary: "text-primary",
      success: "text-success",
      warning: "text-warning",
      destructive: "text-destructive",
    },
  },
  defaultVariants: {
    variant: "title",
    color: "default",
  },
});
