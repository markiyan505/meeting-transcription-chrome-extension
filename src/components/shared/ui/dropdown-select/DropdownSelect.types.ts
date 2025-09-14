import * as React from "react";

export interface DropdownSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface DropdownSelectProps {
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "filled";
  className?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  options: DropdownSelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  id?: string;
  name?: string;
  required?: boolean;
}

export interface DropdownSelectState {
  isOpen: boolean;
  focusedIndex: number;
}

export interface DropdownSelectRef {
  focus: () => void;
  blur: () => void;
  toggle: () => void;
}
