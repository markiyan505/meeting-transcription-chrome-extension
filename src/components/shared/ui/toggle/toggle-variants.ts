import { cva } from "class-variance-authority";

export const toggleVariants = cva(
  "relative inline-flex items-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-gray-200 hover:bg-gray-300 data-[state=on]:bg-gray-800",
        dark: "bg-gray-800 hover:bg-gray-700",
        light: "bg-gray-200 hover:bg-gray-300",
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
        default: "bg-white",
        dark: "bg-white",
        light: "bg-gray-800",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
);
