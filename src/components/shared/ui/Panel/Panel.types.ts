import * as React from "react";

export interface PanelProps {
  children: React.ReactNode;
  variant?: PanelVariant;
  size?: PanelSize;
  className?: string;
}

export type PanelVariant = "default" | "outline" | "filled" | "warning" | "danger";
export type PanelSize = "sm" | "default" | "lg";
