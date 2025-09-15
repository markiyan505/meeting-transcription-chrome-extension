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
  isInMeeting: boolean;
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
  isInMeeting,
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
          <div className={!isInMeeting ? "opacity-50 pointer-events-none" : ""}>
            <RecordingControls
              isRecording={isRecording}
              isPaused={isPaused}
              onStartRecording={onStartRecording}
              onStopRecording={onStopRecording}
              onPauseRecording={onPauseRecording}
              onResumeRecording={onResumeRecording}
              onDeleteRecording={onDeleteRecording}
            />
          </div>
          <Button
            onClick={onToggleFloatPanel}
            variant="outline"
            size="lg"
            leftIcon={<ExternalLink />}
            disabled={!isInMeeting}
            className={!isInMeeting ? "opacity-50" : ""}
          >
            {isFloatPanelVisible ? "Hide Panel" : "Show Panel"}
          </Button>
          {!isInMeeting && (
            <div className="text-center">
              <Typography variant="caption" color="muted" className="text-xs">
                Join a meeting to enable recording controls
              </Typography>
            </div>
          )}
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
            onSyncRecord={() => {}}
            onOpenRecord={() => {}}
            onExportRecord={() => {}}
            onDeleteRecord={() => {}}
          />
        </div>
      )}
    </div>
  );
};

export default HomeTab;
