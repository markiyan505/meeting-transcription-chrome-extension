import * as React from "react";
import { LucideIcon } from "lucide-react";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "filled";
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  error?: boolean;
  helperText?: string;
}
