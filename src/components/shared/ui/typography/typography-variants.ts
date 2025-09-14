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
      success: "text-green-500",
      warning: "text-amber-500",
      danger: "text-red-500",
    },
  },
  defaultVariants: {
    variant: "title",
    color: "default",
  },
});