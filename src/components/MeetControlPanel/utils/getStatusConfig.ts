import { stateType, errorType, StatusConfig } from "../types";

export const getStatusConfig = (
  state: stateType,
  error: errorType
): StatusConfig | null => {
  if (error) {
    return {
      bg: "bg-yellow-500",
      title: error?.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    };
  }

  const stateConfig: Record<stateType, StatusConfig> = {
    recording: { bg: "bg-red-500", title: "Recording" },
    paused: { bg: "bg-red-500 animate-pulse", title: "Paused" },
    idle: { bg: "bg-gray-400", title: "Idle" },
  };

  return stateConfig[state] || null;
};
