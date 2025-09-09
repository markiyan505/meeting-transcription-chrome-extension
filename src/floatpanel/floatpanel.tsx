import { createRoot } from "react-dom/client";
import MeetControlPanel from "@/components/MeetControlPanel/";
import "../index.css";

const container = document.getElementById("floatpanel-root");
if (!container) {
  throw new Error("Float panel root element not found");
}

const root = createRoot(container);
root.render(<MeetControlPanel />);