import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        danger:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm",
        warning: "bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm",
        success: "bg-green-600 hover:bg-green-700 text-white shadow-sm",
      },
      size: {
        sm: "h-8 [&_svg]:h-4 [&_svg]:w-4 text-sm",
        sm_square: "h-7 w-7 [&_svg]:h-4 [&_svg]:w-4 min-w-7 text-sm",
        default: "h-10 [&_svg]:h-4 [&_svg]:w-4 px-4 py-2",
        default_square: "h-10 w-10 [&_svg]:h-4 [&_svg]:w-4 min-w-10",
        lg: "h-11 [&_svg]:h-4 [&_svg]:w-4 text-base",
        lg_square: "h-11 w-11 [&_svg]:h-4 [&_svg]:w-4 min-w-11 text-base",
        xl: "h-12 [&_svg]:h-5 [&_svg]:w-5 px-10 text-lg",
      },
      shape: {
        default: "rounded-md",
        rounded: "rounded-lg",
        pill: "rounded-full",
        square: "rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "default",
    },
  }
);
