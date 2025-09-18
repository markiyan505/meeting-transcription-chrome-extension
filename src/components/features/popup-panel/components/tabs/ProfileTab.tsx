import React, { useEffect } from "react";
import {
  User,
  RefreshCw,
  // Download,
  // Zap,
  // Shield,
  // Bell,
  // FileText,
  // Clock,
  // BarChart3,
} from "lucide-react";
import { Typography } from "@/components/shared/ui/typography";
import { Panel } from "@/components/shared/ui/panel/Panel";
import { Button } from "@/components/shared/ui/button/Button";
import TokenStatus from "../TokenStatus";
import { Icon } from "@/components/shared/ui/icon/Icon";
import {
  type MockUser,
  type MockProfileSettings,
  type MockStats,
  statisticsCardsConfig,
  platformCardsConfig,
} from "../../data/mockData";
import { useAuthStore } from "@/store/AuthStore";
import { useUserProfileStore } from "@/store/useUserProfile";
import CacheInfo from "../CacheInfo";
// import SettingItem from "./SettingItem";

interface ProfileTabProps {
  user: MockUser;
  settings: MockProfileSettings;
  stats: MockStats;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ user, settings, stats }) => {
  const { session, refreshToken, tokenExpiry, isAuthenticated } =
    useAuthStore();
  const { profile, isLoading, error, fetchProfile, refreshProfile } =
    useUserProfileStore();

  // Завантажуємо профіль при ініціалізації (тільки один раз)
  useEffect(() => {
    if (isAuthenticated && !profile && !isLoading) {
      console.log("[ProfileTab] Fetching profile on mount");
      fetchProfile();
    }
  }, [isAuthenticated]); // Видалили fetchProfile з dependencies

  // Use configurations from mockData
  const statisticsCards = statisticsCardsConfig.map((card) => ({
    ...card,
    value: String(stats[card.key as keyof MockStats] || card.value),
  }));

  const platformCards = platformCardsConfig.map((card) => ({
    ...card,
    data: stats.platformStats[card.key as keyof typeof stats.platformStats],
  }));

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
      {/* Profile Header */}
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center space-x-2">
          <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <Icon icon={User} size="lg" />
            )}
          </div>
          <div className="flex flex-col">
            <Typography variant="title" className="font-semibold">
              {profile
                ? `${profile.first_name} ${profile.last_name}`
                : session?.user?.user_metadata?.full_name || user.name}
            </Typography>
            <Typography variant="caption" color="muted">
              {profile?.email || session?.user?.email || user.email}
            </Typography>
            {profile?.role && (
              <Typography
                variant="caption"
                color="muted"
                className="capitalize"
              >
                {profile.role}
              </Typography>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          {/* <div className="flex items-center space-x-2"> */}
            <TokenStatus
              tokenExpiresAt={tokenExpiry}
              onRefreshToken={refreshToken}
              isAuthenticated={isAuthenticated}
            />
            {/* <Button
              variant="ghost"
              size="sm"
              onClick={refreshProfile}
              disabled={isLoading}
              className="flex items-center space-x-1"
            >
              <Icon
                icon={RefreshCw}
                size="sm"
                className={isLoading ? "animate-spin" : ""}
              />
              <Typography variant="caption">Refresh</Typography>
            </Button> */}
          {/* </div> */}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Panel variant="default" size="default" className="text-center py-4">
          <Typography variant="caption" color="muted">
            Loading profile...
          </Typography>
        </Panel>
      )}

      {/* Error State */}
      {error && (
        <Panel variant="danger" size="default" className="text-center py-4">
          <Typography variant="caption" color="destructive">
            Error: {error}
          </Typography>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchProfile}
            className="mt-2"
          >
            Retry
          </Button>
        </Panel>
      )}

      {/* Profile Details */}
      {profile && (
        <div>
          <Typography variant="heading" color="muted" className="mb-2">
            PROFILE DETAILS
          </Typography>
          <Panel variant="default" size="default" className="space-y-3">
            <div className="flex justify-between">
              <Typography variant="caption" color="muted">
                First Name
              </Typography>
              <Typography variant="caption">{profile.first_name}</Typography>
            </div>
            <div className="flex justify-between">
              <Typography variant="caption" color="muted">
                Last Name
              </Typography>
              <Typography variant="caption">{profile.last_name}</Typography>
            </div>
            <div className="flex justify-between">
              <Typography variant="caption" color="muted">
                Email
              </Typography>
              <Typography variant="caption">{profile.email}</Typography>
            </div>
            <div className="flex justify-between">
              <Typography variant="caption" color="muted">
                Role
              </Typography>
              <Typography variant="caption" className="capitalize">
                {profile.role}
              </Typography>
            </div>
            {profile.created_at && (
              <div className="flex justify-between">
                <Typography variant="caption" color="muted">
                  Member Since
                </Typography>
                <Typography variant="caption">
                  {new Date(profile.created_at).toLocaleDateString()}
                </Typography>
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* Cache Information */}
      {/* <CacheInfo /> */}

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
