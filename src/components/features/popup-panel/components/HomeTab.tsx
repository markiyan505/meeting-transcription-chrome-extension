import React from "react";
import { Play, Square, Pause, ExternalLink, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/shared/ui/button/Button";
import { Icon } from "@/components/shared/ui/Icon/Icon";
import { LastRecord } from "./RecordPanel/RecordPanel";
import { Panel } from "@/components/shared/ui/Panel/Panel";
import { Typography } from "@/components/shared/ui/typography";

interface HomeTabProps {
  isRecording: boolean;
  isPaused: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onDeleteRecording: () => void;
  onToggleFloatPanel: () => void;
  isFloatPanelVisible: boolean;
  todayRecords: number;
  totalTime: string;
  lastRecord?: {
    id: string;
    platform: string;
    title: string;
    time: string;
    duration: string;
    captionCount: number;
    messageCount: number;
    attendeeCount: number;
    isSynced: boolean;
  };
}

const HomeTab: React.FC<HomeTabProps> = ({
  isRecording,
  isPaused,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  onDeleteRecording,
  onToggleFloatPanel,
  isFloatPanelVisible,
  todayRecords,
  totalTime,
  lastRecord,
}) => {
  return (
    <div className="p-4 space-y-5 w-full">
      <div>
        <Typography variant="heading" color="muted" className="mb-2">
          QUICK ACTIONS
        </Typography>
        <div className="space-y-2">
          {!isRecording ? (
            <Button onClick={onStartRecording} size="lg" leftIcon={<Play />}>
              Start Recording
            </Button>
          ) : (
            <div className="space-y-2">
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
            </div>
          )}
          <Button
            onClick={onToggleFloatPanel}
            variant="outline"
            size="lg"
            leftIcon={<ExternalLink />}
          >
            {isFloatPanelVisible ? "Hide Panel" : "Show Panel"}
          </Button>
        </div>
      </div>

      <div>
        <Typography variant="heading" color="muted" className="mb-2">
          QUICK STATS
        </Typography>
        <div className="grid grid-cols-2 gap-3">
          <Panel variant="outline" size="sm">
            <div className="flex items-center space-x-2 text-muted-foreground mb-1">
              <Icon icon={Clock} color="muted" />
              <Typography variant="caption" color="muted">
                Today
              </Typography>
            </div>
            <Typography variant="stat">{todayRecords} records</Typography>
            <Typography variant="stat">{totalTime}</Typography>
          </Panel>
          <Panel variant="outline" size="sm">
            <div className="flex items-center space-x-2 text-muted-foreground mb-1">
              <Icon icon={Clock} color="muted" />
              <Typography variant="caption" color="muted">
                This week
              </Typography>
            </div>
            <Typography variant="stat">{todayRecords} records</Typography>
            <Typography variant="stat">{totalTime}</Typography>
          </Panel>
        </div>
      </div>

      {lastRecord && (
        <div>
          <Typography variant="heading" color="muted" className="mb-2">
            LAST RECORD
          </Typography>
          <LastRecord
            record={lastRecord}
            onSyncRecord={(id) => console.log("Sync record:", id)}
            onOpenRecord={(id) => console.log("Open record:", id)}
            onExportRecord={(id) => console.log("Export record:", id)}
            onDeleteRecord={(id) => console.log("Delete record:", id)}
          />
        </div>
      )}
    </div>
  );
};

export default HomeTab;
