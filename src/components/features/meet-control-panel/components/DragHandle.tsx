import React from "react";
import { orientationType } from "../types";

interface DragHandleProps {
  orientation: orientationType;
}

const Dot = () => <div className="w-1 h-1 bg-gray-300 rounded-full" />;

const DotRow = ({ count }: { count: number }) => (
  <div className="flex gap-1">
    {Array.from({ length: count }, (_, i) => (
      <Dot key={i} />
    ))}
  </div>
);

const DotColumn = ({ count }: { count: number }) => (
  <div className="flex flex-col gap-1">
    {Array.from({ length: count }, (_, i) => (
      <Dot key={i} />
    ))}
  </div>
);

const CustomGripVertical = () => (
  <div className="flex flex-col gap-1">
    <DotRow count={4} />
    <DotRow count={4} />
  </div>
);

const CustomGripHorizontal = () => (
  <div className="flex gap-1">
    <DotColumn count={4} />
    <DotColumn count={4} />
  </div>
);

export const DragHandle: React.FC<DragHandleProps> = ({ orientation }) => {
  const getDragHandleIcon = () => {
    if (orientation === "vertical") {
      return <CustomGripVertical />; 
    } else {
      return <CustomGripHorizontal />; 
    }
  };

  return (
    <div className="w-full h-w-full p-1 flex items-center justify-center cursor-move text-gray-400">
      {getDragHandleIcon()}
    </div>
  );
};
