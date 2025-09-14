import { cva } from "class-variance-authority";

export const toggleVariants = cva(
  "relative inline-flex items-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-muted hover:bg-muted/80 data-[state=on]:bg-primary",
        dark: "bg-muted hover:bg-muted/80 data-[state=on]:bg-primary",
        light: "bg-muted hover:bg-muted/80 data-[state=on]:bg-primary",
      },
      size: {
        sm: "h-5 w-9",
        default: "h-6 w-11",
        lg: "h-7 w-[52px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export const thumbVariants = cva(
  "inline-block transform rounded-full transition-transform",
  {
    variants: {
      size: {
        sm: "h-3 w-3",
        default: "h-4 w-4",
        lg: "h-5 w-5",
      },
      variant: {
        default: "bg-background data-[state=on]:bg-primary-foreground",
        dark: "bg-background data-[state=on]:bg-primary-foreground",
        light: "bg-background data-[state=on]:bg-primary-foreground",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
);
