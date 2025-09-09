import { createApp } from "@/shared/utils/createApp";
import PopupApp from "./PopupApp";
import "../../index.css";

createApp({
  rootId: "popup-root",
  component: PopupApp,
  errorMessage: "Popup root element not found",
});
