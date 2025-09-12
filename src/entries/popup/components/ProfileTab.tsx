import React from "react";
import {
  User,
  Download,
  ToggleLeft,
  ToggleRight,
  Zap,
  Shield,
  Bell,
  FileText,
  Clock,
  BarChart3,
} from "lucide-react";

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
    thisWeekRecords: number;
    thisMonthRecords: number;
  };
  onSettingChange: (key: string, value: any) => void;
  onExportData: () => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({
  user,
  settings,
  stats,
  onSettingChange,
  onExportData,
}) => {
  const settingsItems = [
    {
      key: "autoStart",
      icon: Zap,
      title: "Auto Start",
      description: "Start recording on meeting entry",
    },
    {
      key: "autoEnableCaptions",
      icon: FileText,
      title: "Auto Enable Captions",
      description: "Enable captions on record start",
    },
    {
      key: "allowAutoEnable",
      icon: Shield,
      title: "Allow Auto-Enabling",
      description: "Permit extension to enable captions",
    },
    {
      key: "notifications",
      icon: Bell,
      title: "Notifications",
      description: "Show status notifications",
    },
  ];

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{user.name}</h3>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-muted-foreground mb-2">
          STATISTICS
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-card border border-border rounded-lg text-center">
            <p className="text-xl font-bold text-foreground">
              {stats.totalRecords}
            </p>
            <p className="text-xs text-muted-foreground">Total Records</p>
          </div>
          <div className="p-3 bg-card border border-border rounded-lg text-center">
            <p className="text-xl font-bold text-foreground">
              {stats.totalTime}
            </p>
            <p className="text-xs text-muted-foreground">Total Time</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-muted-foreground mb-2">
          SETTINGS
        </h3>
        <div className="space-y-2">
          {settingsItems.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between p-2.5 bg-card border border-border rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <item.icon className="w-4 h-4 text-muted-foreground" />
                <div>
                  <span className="text-sm font-medium text-foreground">
                    {item.title}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  onSettingChange(item.key, !(settings as any)[item.key])
                }
              >
                {(settings as any)[item.key] ? (
                  <ToggleRight className="w-8 h-8 text-primary" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-muted" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <button
          onClick={onExportData}
          className="w-full flex items-center justify-center space-x-2 p-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-muted transition-colors font-medium"
        >
          <Download className="w-4 h-4" />
          <span>Export All Data</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileTab;
