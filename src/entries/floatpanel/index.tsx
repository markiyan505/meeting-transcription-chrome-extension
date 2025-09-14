import { createApp } from "@/utils/createApp";
import MeetControlPanel from "@/components/features/meet-control-panel/MeetControlPanel";
import "../../index.css";

createApp({
  rootId: "floatpanel-root",
  component: MeetControlPanel,
  errorMessage: "Float panel root element not found",
});
