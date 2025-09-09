import React from "react";
import { StatusIndicator as BaseStatusIndicator } from "@/components/ui/status-indicator";
import { stateType, errorType } from "../types";
import { getStatusConfig } from "../utils/getStatusConfig";

interface StatusIndicatorProps {
  state: stateType;
  error: errorType;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  state,
  error,
}) => {
  const config = getStatusConfig(state, error);
  if (!config) return null;

  // Map our status to base component status
  const getStatusVariant = (bg: string) => {
    if (bg.includes("green")) return "success";
    if (bg.includes("red")) return "error";
    if (bg.includes("yellow")) return "warning";
    if (bg.includes("blue")) return "info";
    return "neutral";
  };

  return (
    <BaseStatusIndicator
      status={getStatusVariant(config.bg)}
      icon={
        <div className={`w-2 h-2 my-1.5 mx-1 rounded-full ${config.bg}`} />
      }
    />
  );
};
