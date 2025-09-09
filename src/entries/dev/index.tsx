import { createApp } from "@/shared/utils/createApp";
import DevApp from "./DevApp";
import "../../index.css";

createApp({
  rootId: "dev-root",
  component: DevApp,
  errorMessage: "Dev root element not found",
});
