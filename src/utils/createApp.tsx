import React from "react";
import { createRoot } from "react-dom/client";

export interface AppConfig {
  rootId: string;
  component: React.ComponentType;
  errorMessage: string;
}

export const createApp = (config: AppConfig) => {
  const container = document.getElementById(config.rootId);
  if (!container) {
    throw new Error(config.errorMessage);
  }

  const root = createRoot(container);
  root.render(<config.component />);

  return root;
};
