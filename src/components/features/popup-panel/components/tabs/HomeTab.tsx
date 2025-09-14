import React from "react";
import { ExternalLink, Clock } from "lucide-react";
import { Button } from "@/components/shared/ui/button/Button";
import { Icon } from "@/components/shared/ui/icon/Icon";
import { LastRecord } from "../Cards/record-card/RecordPanel";
import { Typography } from "@/components/shared/ui/typography";
import { type MockRecord } from "../../data/mockData";
import RecordingControls from "../RecordingControls";
import StatsCard from "../Cards/StatsCard";
import { quickStatsConfig } from "../../data/mockData";

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
  lastRecord?: MockRecord;
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
          <RecordingControls
            isRecording={isRecording}
            isPaused={isPaused}
            onStartRecording={onStartRecording}
            onStopRecording={onStopRecording}
            onPauseRecording={onPauseRecording}
            onResumeRecording={onResumeRecording}
            onDeleteRecording={onDeleteRecording}
          />
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
          {quickStatsConfig.map((stat, index) => (
            <StatsCard
              key={index}
              icon={Clock}
              iconColor="muted"
              label={stat.label}
              value={
                index === 0
                  ? `${todayRecords} records`
                  : `${todayRecords} records`
              }
              variant={stat.variant}
              size="sm"
            />
          ))}
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
