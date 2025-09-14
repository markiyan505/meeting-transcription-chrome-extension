import { createApp } from "@/utils/createApp";
import FloatPanelSubtitles from "@/components/features/subtitles-panel/FloatPanelSubtitles";
import "../../index.css";

createApp({
  rootId: "floatpanel-subtitles-root",
  component: FloatPanelSubtitles,
  errorMessage: "Float panel root element not found",
});
