import { createRoot } from "react-dom/client";
import FloatPanelApp from "./FloatPanelApp";
import "../index.css";

const container = document.getElementById("floatpanel-root");
if (!container) {
  throw new Error("Float panel root element not found");
}

const root = createRoot(container);
root.render(<FloatPanelApp />);
