import React from "react";
import { LastRecordProps } from "./RecordPanel.types";
import { RecordHeader } from "./RecordHeader";
import { RecordStats } from "./RecordStats";
import { RecordActions } from "./RecordActions";
import { Panel } from "@/components/shared/ui/panel/Panel";
import { Typography } from "@/components/shared/ui/typography";

export const LastRecord: React.FC<LastRecordProps> = ({
  record,
  onSyncRecord,
  onOpenRecord,
  onExportRecord,
  onDeleteRecord,
}) => {
  return (
    <div>
      <Panel variant="default" size="sm">
        <div className="flex flex-row justify-between">
          <div className="flex flex-col justify-between m-1">
            <RecordHeader
              platform={record.platform}
              title={record.title}
              time={record.time}
              duration={record.duration}
            />
            <RecordStats
              captionCount={record.captionCount}
              messageCount={record.messageCount}
              attendeeCount={record.attendeeCount}
              isSynced={record.isSynced}
            />
          </div>

          <RecordActions
            isSynced={record.isSynced}
            recordId={record.id}
            onSyncRecord={onSyncRecord}
            onOpenRecord={onOpenRecord}
            onExportRecord={onExportRecord}
            onDeleteRecord={onDeleteRecord}
          />
        </div>
      </Panel>
    </div>
  );
};
