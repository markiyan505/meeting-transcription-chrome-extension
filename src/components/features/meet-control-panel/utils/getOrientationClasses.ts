import { orientationType } from "../types";

export const getOrientationClasses = (orientation: orientationType, revert?: boolean): string => {
  if (revert) {
    return orientation === "horizontal" ? "flex-col flex-col-reverse" : "flex-row";
  }
  return orientation === "horizontal" ? "flex-row" : "flex-col";
};

export const getSeparatorOrientation = (
  orientation: orientationType
): "horizontal" | "vertical" => {
  return orientation === "vertical" ? "horizontal" : "vertical";
};
