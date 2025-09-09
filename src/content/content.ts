console.log("Content script loaded");

// Import modules
import { CONTROL_PANEL, SUBTITLES_PANEL } from "./types/types";
import { createFloatPanel } from "./panels/panelFactory";
import {
  setupRuntimeMessageHandler,
  setupWindowMessageHandler,
} from "./messaging/messaging";

// Setup message handlers
setupRuntimeMessageHandler();
setupWindowMessageHandler();

// Create panels using unified function
createFloatPanel(CONTROL_PANEL);
createFloatPanel(SUBTITLES_PANEL);
