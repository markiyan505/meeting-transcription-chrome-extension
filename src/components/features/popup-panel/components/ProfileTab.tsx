import React from "react";
import {
  User,
  // Download,
  // Zap,
  // Shield,
  // Bell,
  // FileText,
  // Clock,
  // BarChart3,
} from "lucide-react";
import { Typography } from "@/components/shared/ui/typography";
import { Panel } from "@/components/shared/ui/Panel/Panel";
import TokenStatus from "./TokenStatus";
import { Icon } from "@/components/shared/ui/Icon/Icon";
// import SettingItem from "./SettingItem";

interface PlatformStats {
  googleMeet: {
    totalMeetings: number;
    totalDuration: string;
    averageDuration: string;
  };
  teams: {
    totalMeetings: number;
    totalDuration: string;
    averageDuration: string;
  };
}

interface ProfileTabProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  settings: {
    autoStart: boolean;
    autoEnableCaptions: boolean;
    allowAutoEnable: boolean;
    theme: "light" | "dark";
    notifications: boolean;
  };
  stats: {
    totalRecords: number;
    totalTime: string;
    averageTime: string;
    thisWeekRecords: number;
    thisMonthRecords: number;
    platformStats: PlatformStats;
  };
  onSettingChange: (key: string, value: any) => void;
  onExportData: () => void;
  onRefreshToken?: () => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({
  user,
  settings,
  stats,
  onSettingChange,
  onExportData,
  onRefreshToken,
}) => {
  // Statistics cards configuration
  const statisticsCards = [
    {
      key: "totalRecords",
      value: stats.totalRecords,
      label: "Total Records",
      variant: "default" as const,
    },
    {
      key: "totalTime",
      value: stats.totalTime,
      label: "Total Time",
      variant: "default" as const,
    },
    {
      key: "thisWeekRecords",
      value: stats.thisWeekRecords,
      label: "This Week",
      variant: "outline" as const,
    },
    {
      key: "averageTime",
      value: stats.averageTime,
      label: "Average Time",
      variant: "outline" as const,
    },
  ];

  // Platform breakdown configuration
  const platformCards = [
    {
      key: "googleMeet",
      name: "Google Meet",
      data: stats.platformStats.googleMeet,
    },
    {
      key: "teams",
      name: "Microsoft Teams",
      data: stats.platformStats.teams,
    },
  ];

  // const settingsItems = [
  //   {
  //     key: "autoStart",
  //     icon: Zap,
  //     title: "Auto Start",
  //     description: "Start recording on meeting entry",
  //   },
  //   {
  //     key: "autoEnableCaptions",
  //     icon: FileText,
  //     title: "Auto Enable Captions",
  //     description: "Enable captions on record start",
  //   },
  //   {
  //     key: "allowAutoEnable",
  //     icon: Shield,
  //     title: "Allow Auto-Enabling",
  //     description: "Permit extension to enable captions",
  //   },
  //   {
  //     key: "notifications",
  //     icon: Bell,
  //     title: "Notifications",
  //     description: "Show status notifications",
  //   },
  // ];

  return (
    <div className="p-4 space-y-5 w-full">
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center space-x-2">
          <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
            <Icon icon={User} size="lg" />
          </div>
          <div className="flex flex-col">
            <Typography variant="title" className="font-semibold">
              {user.name}
            </Typography>
            <Typography variant="caption" color="muted">
              {user.email}
            </Typography>
          </div>
        </div>
        <TokenStatus onRefreshToken={onRefreshToken} />
      </div>

      <div>
        <Typography variant="heading" color="muted" className="mb-2">
          STATISTICS
        </Typography>
        <div className="grid grid-cols-2 gap-3">
          {statisticsCards.map((card) => (
            <Panel
              key={card.key}
              variant={card.variant}
              size="default"
              className="text-center"
            >
              <Typography variant="stat">{card.value}</Typography>
              <Typography variant="caption" color="muted">
                {card.label}
              </Typography>
            </Panel>
          ))}
        </div>
      </div>

      <div>
        <Typography variant="heading" color="muted" className="mb-2">
          PLATFORM BREAKDOWN
        </Typography>
        <div className="space-y-3">
          {platformCards.map((platform) => (
            <Panel key={platform.key} variant="default" size="default">
              <div className="flex justify-between items-center mb-2">
                <Typography variant="caption" className="font-medium">
                  {platform.name}
                </Typography>
                <Typography variant="caption" color="muted">
                  {platform.data.totalMeetings} meetings
                </Typography>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Typography variant="caption" color="muted">
                    Total Duration
                  </Typography>
                  <Typography variant="caption">
                    {platform.data.totalDuration}
                  </Typography>
                </div>
                <div className="flex justify-between">
                  <Typography variant="caption" color="muted">
                    Average Duration
                  </Typography>
                  <Typography variant="caption">
                    {platform.data.averageDuration}
                  </Typography>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      </div>

      {/* Temporarily hidden SETTINGS section */}
      {/* <div>
        <Typography variant="heading" color="muted" className="mb-2">
          SETTINGS
        </Typography>
        <div className="space-y-2">
          {settingsItems.map((item) => (
            <SettingItem
              key={item.key}
              icon={item.icon}
              title={item.title}
              description={item.description}
              checked={(settings as any)[item.key]}
              onChange={(checked) => onSettingChange(item.key, checked)}
            />
          ))}
        </div>
      </div> */}
    </div>
  );
};

export default ProfileTab;
