import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { typographyVariants } from "./typography-variants";

export interface TypographyProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "color">,
    VariantProps<typeof typographyVariants> {
  as?: keyof JSX.IntrinsicElements;
}

export type TypographyVariant = "heading" | "title" | "caption" | "stat";
export type TypographyColor =
  | "default"
  | "muted"
  | "primary"
  | "success"
  | "warning"
  | "destructive";
