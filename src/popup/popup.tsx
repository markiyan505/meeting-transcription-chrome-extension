import { createRoot } from "react-dom/client";
import PopupApp from "./PopupApp";
import "../index.css";

const container = document.getElementById("popup-root");
if (!container) {
  throw new Error("Popup root element not found");
}

const root = createRoot(container);
root.render(<PopupApp />);
