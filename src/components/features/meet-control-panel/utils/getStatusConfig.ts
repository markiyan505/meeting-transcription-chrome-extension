import { ErrorType, StateType } from "@/types/session";
import { StatusConfig } from "../types";

export const getStatusConfig = (
  state: StateType,
  error: ErrorType
): StatusConfig | null => {
  if (error) {
    return {
      bg: "bg-yellow-500",
      title: error?.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    };
  }

  const stateConfig: Record<StateType, StatusConfig> = {  
    recording: { bg: "bg-red-500", title: "Recording" },
    paused: { bg: "bg-red-500 animate-pulse", title: "Paused" },
    idle: { bg: "bg-gray-400", title: "Idle" },
    starting: { bg: "bg-yellow-500", title: "Starting" },
    resuming: { bg: "bg-yellow-500", title: "Resuming" },
    error: { bg: "bg-yellow-500", title: "Error" },
  };

  return stateConfig[state] || null;
};
