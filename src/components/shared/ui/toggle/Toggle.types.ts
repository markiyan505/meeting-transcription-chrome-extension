import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { toggleVariants } from "./toggle-variants";

export interface ToggleProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange">,
    VariantProps<typeof toggleVariants> {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  size?: ToggleSize;
  variant?: ToggleVariant;
}

export type ToggleVariant = "default" | "dark" | "light";
export type ToggleSize = "sm" | "default" | "lg";
