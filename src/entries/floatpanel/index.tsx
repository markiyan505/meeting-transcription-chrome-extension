import { createApp } from "@/shared/utils/createApp";
import MeetControlPanel from "@/components/MeetControlPanel";
import "../../index.css";

createApp({
  rootId: "floatpanel-root",
  component: MeetControlPanel,
  errorMessage: "Float panel root element not found",
});
