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

import { StateType, ErrorType } from "@/types/session";
import { useExtensionCommands } from "@/components/shared/hooks/useExtensionCommands";

interface HomeTabProps {
  state: StateType;
  error: ErrorType;
  isInMeeting: boolean;
  isFloatPanelVisible: boolean;
  todayRecords: number;
  totalTime: string;
  lastRecord?: MockRecord;
}

const HomeTab: React.FC<HomeTabProps> = ({
  state,
  error,
  isInMeeting,
  isFloatPanelVisible,
  todayRecords,
  totalTime,
  lastRecord,
}) => {
  const { togglePanelVisibility, toggleExtension } = useExtensionCommands();
  return (
    <div className="p-4 space-y-5 w-full">
      <div>
        <Typography variant="heading" color="muted" className="mb-2">
          QUICK ACTIONS
        </Typography>
        <div className="space-y-2">
          <div className={!isInMeeting ? "opacity-50 pointer-events-none" : ""}>
            <RecordingControls state={state} error={error} />
          </div>
          <Button
            onClick={togglePanelVisibility}
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
