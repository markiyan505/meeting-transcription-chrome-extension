import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { buttonVariants } from "./button-variants";
import type { TooltipPosition } from "@/components/shared/ui/tooltip/Tooltip.types";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  tooltip?: string;
  tooltipPosition?: TooltipPosition;
}

export type ButtonVariant =
  | "default"
  | "primary"
  | "secondary"
  | "danger"
  | "outline"
  | "ghost"
  | "link"
  | "success"
  | "warning"
  | "info";

export type ButtonSize = "sm" | "default" | "lg" | "xl";

export type ButtonShape = "default" | "rounded" | "pill" | "square";
