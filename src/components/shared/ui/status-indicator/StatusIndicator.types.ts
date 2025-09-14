import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { statusIndicatorVariants } from "./StatusIndicator";

export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusIndicatorVariants> {
  icon: React.ReactNode;
  label?: string;
}

export type StatusVariant =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "neutral";
