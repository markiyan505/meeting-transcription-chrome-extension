import React from "react";
import { Play, Square, Pause, Trash2 } from "lucide-react";
import { Button } from "@/components/shared/ui/button/Button";

interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onDeleteRecording: () => void;
  className?: string;
}

const RecordingControls: React.FC<RecordingControlsProps> = ({
  isRecording,
  isPaused,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  onDeleteRecording,
  className = "",
}) => {
  if (!isRecording) {
    return (
      <Button onClick={onStartRecording} size="lg" leftIcon={<Play />}>
        Start Recording
      </Button>
    );
  }

  return (
    <div className="flex flex-row gap-2">
      <Button
        onClick={isPaused ? onResumeRecording : onPauseRecording}
        size="lg"
        leftIcon={isPaused ? <Play /> : <Pause />}
      >
        {isPaused ? "Resume" : "Pause"}
      </Button>
      <Button
        onClick={onStopRecording}
        variant="danger"
        size="lg"
        leftIcon={<Square />}
      >
        Stop
      </Button>
      <Button
        onClick={onDeleteRecording}
        variant="danger"
        size="lg_square"
        leftIcon={<Trash2 />}
      ></Button>
    </div>
  );
};

export default RecordingControls;
