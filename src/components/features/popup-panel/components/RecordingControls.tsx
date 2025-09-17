import React from "react";
import { Play, Square, Pause, Trash2 } from "lucide-react";
import { Button } from "@/components/shared/ui/button/Button";
import { ErrorType, StateType } from "@/types/session";

interface RecordingControlsProps {
  state: StateType;
  error: ErrorType;
  className?: string;
}

import { useExtensionCommands } from "@/components/shared/hooks/useExtensionCommands";
const RecordingControls: React.FC<RecordingControlsProps> = ({
  state,
  error,
  className = "",
}) => {
  const {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    deleteRecording,
  } = useExtensionCommands();

  return (
    <div className="flex flex-row gap-2">
      {(state === "idle" || state === "starting") && (
        <Button
          onClick={startRecording}
          size="lg"
          loading={state === "starting"}
          leftIcon={<Play />}
        >
          {state === "starting" ? "Starting" : "Start Recording"}
        </Button>
      )}
      {(state === "recording" || state === "resuming") && (
        <Button onClick={pauseRecording} size="lg" leftIcon={<Pause />}>
          Pause
        </Button>
      )}
      {(state === "paused" || state === "resuming") && (
        <Button
          onClick={resumeRecording}
          size="lg"
          loading={state === "resuming"}
          leftIcon={<Play />}
        >
          {state === "resuming" ? "Resuming" : "Resume"}
        </Button>
      )}
      {state !== "idle" && (
        <Button
          onClick={stopRecording}
          variant="danger"
          size="lg"
          leftIcon={<Square />}
        >
          Stop Recording
        </Button>
      )}
      {state !== "idle" && (
        <Button
          onClick={deleteRecording}
          variant="danger"
          size="lg_square"
          leftIcon={<Trash2 />}
        />
      )}
    </div>
  );
};

export default RecordingControls;
