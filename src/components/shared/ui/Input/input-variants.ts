import { cva } from "class-variance-authority";

export const inputVariants = cva(
  "w-full bg-card border rounded-lg transition-colors focus:ring-2 focus:ring-ring focus:outline-none",
  {
    variants: {
      size: {
        sm: "px-3 py-1.5 text-sm [&_svg]:h-4 [&_svg]:w-4",
        default: "px-4 py-2 text-sm [&_svg]:h-4 [&_svg]:w-4",
        lg: "px-4 py-3 text-base [&_svg]:h-4 [&_svg]:w-4",
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
      hasLeftIcon: {
        true: "",
        false: "",
      },
      hasRightIcon: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        size: "sm",
        hasLeftIcon: true,
        class: "pl-7",
      },
      {
        size: "default",
        hasLeftIcon: true,
        class: "pl-9",
      },
      {
        size: "lg",
        hasLeftIcon: true,
        class: "pl-10",
      },
      {
        size: "sm",
        hasRightIcon: true,
        class: "pr-7",
      },
      {
        size: "default",
        hasRightIcon: true,
        class: "pr-9",
      },
      {
        size: "lg",
        hasRightIcon: true,
        class: "pr-10",
      },
    ],
    defaultVariants: {
      size: "default",
      variant: "default",
      disabled: false,
      error: false,
      hasLeftIcon: false,
      hasRightIcon: false,
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
