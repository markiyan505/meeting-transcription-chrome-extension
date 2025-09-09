import { createRoot } from "react-dom/client";
import DevApp from "./DevApp";
import "../index.css";
import "./dev.css";

const container = document.getElementById("dev-root");
if (!container) {
  throw new Error("Dev root element not found");
}

const root = createRoot(container);
root.render(<DevApp />);
