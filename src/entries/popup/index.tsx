import { createApp } from "@/utils/createApp";
import PopupApp from "@/components/features/popup-panel/PopupApp";
import "../../index.css";

createApp({
  rootId: "popup-root",
  component: PopupApp,
  errorMessage: "Popup root element not found",
});
