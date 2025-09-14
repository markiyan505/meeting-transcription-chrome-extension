import React from "react";
import { Icon } from "@/components/shared/ui/icon/Icon";
import { Typography } from "@/components/shared/ui/typography";
import { Video, Phone } from "lucide-react";

interface RecordHeaderProps {
  platform: string;
  title: string;
  time: string;
  duration: string;
}

export const RecordHeader: React.FC<RecordHeaderProps> = ({
  platform,
  title,
  time,
  duration,
}) => {
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "google-meet":
        return <Icon icon={Video} color="primary" tooltip="Google Meet" />;
      case "teams":
        return <Icon icon={Phone} color="primary" tooltip="Microsoft Teams" />;
      default:
        return (
          <Icon
            icon={Video}
            size="sm"
            color="muted"
            tooltip="Unknown Platform"
          />
        );
    }
  };

  return (
    <>
      <div className="flex items-center space-x-2 mb-0.5">
        {getPlatformIcon(platform)}
        <Typography variant="title" className="truncate">
          {title}
        </Typography>
      </div>
      <Typography variant="caption" color="muted" className="mb-3">
        {time} • {duration}
      </Typography>
    </>
  );
};
