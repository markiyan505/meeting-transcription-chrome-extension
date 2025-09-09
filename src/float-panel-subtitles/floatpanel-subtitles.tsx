import { createRoot } from "react-dom/client";
import "../index.css";
import FloatPanelSubtitles from "../components/SubtitlesPanel/FloatPanelSubtitles";

const container = document.getElementById("floatpanel-subtitles-root");
if (!container) {
  throw new Error("Float panel root element not found");
}

const root = createRoot(container);
root.render(<FloatPanelSubtitles />);
