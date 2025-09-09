import { createApp } from "@/shared/utils/createApp";
import FloatPanelSubtitles from "@/components/SubtitlesPanel/FloatPanelSubtitles";
import "../../index.css";

createApp({
  rootId: "floatpanel-subtitles-root",
  component: FloatPanelSubtitles,
  errorMessage: "Float panel root element not found",
});
