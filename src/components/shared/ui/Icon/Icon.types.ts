import * as React from "react";
import { LucideIcon } from "lucide-react";
import type { TooltipPosition } from "@/components/shared/ui/tooltip/Tooltip.types";

export interface IconProps {
  icon: LucideIcon;
  size?: IconSize;
  color?: IconColor;
  className?: string;
  tooltip?: string;
  tooltipPosition?: TooltipPosition;
  tooltipDelay?: number;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

export type IconSize = "sm" | "default" | "lg" | "xl";
export type IconColor =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "destructive"
  | "muted"
  | "accent";
