import React from "react";
import {
  Play,
  Square,
  Pause,
  ExternalLink,
  Clock,
  FileText,
  Zap,
} from "lucide-react";

interface HomeTabProps {
  isRecording: boolean;
  isPaused: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onToggleFloatPanel: () => void;
  isFloatPanelVisible: boolean;
  todayRecords: number;
  totalTime: string;
  lastRecord?: {
    title: string;
    time: string;
    duration: string;
  };
}

const HomeTab: React.FC<HomeTabProps> = ({
  isRecording,
  isPaused,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  onToggleFloatPanel,
  isFloatPanelVisible,
  todayRecords,
  totalTime,
  lastRecord,
}) => {
  return (
    <div className="p-4 space-y-5">
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground mb-2">
          QUICK ACTIONS
        </h3>
        <div className="space-y-2">
          {!isRecording ? (
            <button
              onClick={onStartRecording}
              className="w-full flex items-center justify-center space-x-2 p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <Play className="w-4 h-4" />
              <span>Start Recording</span>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={isPaused ? onResumeRecording : onPauseRecording}
                className="flex items-center justify-center space-x-2 p-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-muted transition-colors font-medium"
              >
                {isPaused ? (
                  <Play className="w-4 h-4" />
                ) : (
                  <Pause className="w-4 h-4" />
                )}
                <span>{isPaused ? "Resume" : "Pause"}</span>
              </button>
              <button
                onClick={onStopRecording}
                className="flex items-center justify-center space-x-2 p-3 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors font-medium"
              >
                <Square className="w-4 h-4" />
                <span>Stop</span>
              </button>
            </div>
          )}
          <button
            onClick={onToggleFloatPanel}
            className="w-full flex items-center justify-center space-x-2 p-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-muted transition-colors font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            <span>{isFloatPanelVisible ? "Hide Panel" : "Show Panel"}</span>
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-muted-foreground mb-2">
          QUICK STATS
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-card border border-border rounded-lg">
            <div className="flex items-center space-x-2 text-muted-foreground mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-xs font-medium">Today</span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {todayRecords} records
            </p>
          </div>
          <div className="p-3 bg-card border border-border rounded-lg">
            <div className="flex items-center space-x-2 text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">Total Time</span>
            </div>
            <p className="text-lg font-bold text-foreground">{totalTime}</p>
          </div>
        </div>
      </div>

      {lastRecord && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground mb-2">
            LAST RECORD
          </h3>
          <div className="p-3 bg-card border border-border rounded-lg">
            <p className="text-sm font-medium text-foreground truncate">
              {lastRecord.title}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {lastRecord.time} • {lastRecord.duration}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeTab;
