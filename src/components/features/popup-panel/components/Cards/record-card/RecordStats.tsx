import React from "react";
import { FileText, Subtitles, Users, CheckCircle, XCircle } from "lucide-react";
import { Icon } from "@/components/shared/ui/icon/Icon";
import { Typography } from "@/components/shared/ui/typography/Typography";

interface RecordStatsProps {
  captionCount: number;
  messageCount: number;
  attendeeCount: number;
  isSynced: boolean;
}

export const RecordStats: React.FC<RecordStatsProps> = ({
  captionCount,
  messageCount,
  attendeeCount,
  isSynced,
}) => {
  return (
    <div className="flex flex-row items-center justify-start gap-3">
      <span className="flex items-center gap-0.5">
        <Icon icon={FileText} size="sm" tooltip="Caption Count" />
        <Typography variant="caption">{captionCount}</Typography>
      </span>
      <span className="flex items-center gap-0.5">
        <Icon icon={Subtitles} size="sm" tooltip="Message Count" />
        <Typography variant="caption">{messageCount}</Typography>
      </span>
      <span className="flex items-center gap-1">
        <Icon icon={Users} size="sm" tooltip="Attendee Count" />
        <Typography variant="caption">{attendeeCount}</Typography>
      </span>
      {isSynced ? (
        <Icon icon={CheckCircle} color="success" size="sm" tooltip="Synced" />
      ) : (
        <Icon
          icon={XCircle}
          color="destructive"
          size="sm"
          tooltip="Not Synced"
        />
      )}
    </div>
  );
};
