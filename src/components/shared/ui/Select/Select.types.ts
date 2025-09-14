import * as React from "react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    "size" | "onChange"
  > {
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "filled";
  className?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}
