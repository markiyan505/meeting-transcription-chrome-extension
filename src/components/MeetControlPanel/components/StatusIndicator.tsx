import React from "react";
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

  return (
    <div className={`w-3 h-3 rounded-full ${config.bg}`} title={config.title} />
  );
};
