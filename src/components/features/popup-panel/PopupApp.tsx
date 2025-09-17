import React, { useState, useEffect } from "react";

import {
  useCaptionStore,
  selectIsRecording,
  selectIsPaused,
} from "@/store/captionStore";
import { useSyncCaptionStore } from "@/store/useSyncCaptionStore";
import { useAuthStore } from "@/store/AuthStore";
import { useSyncAuthStore } from "@/store/useSyncAuthStore";

import type { TabType } from "./components/tabs/Tabs";
import Header from "./components/Header";
import Tabs from "./components/tabs/Tabs";
import HomeTab from "./components/tabs/HomeTab";
import RecordsTab from "./components/tabs/RecordsTab";
import ProfileTab from "./components/tabs/ProfileTab";
import {
  mockData,
  type MockRecord,
  type MockUser,
  type MockProfileSettings,
  type MockStats,
} from "./data/mockData";

const PopupApp: React.FC = () => {
  useSyncCaptionStore();
  useSyncAuthStore();

  const {
    state,
    error,
    isExtensionEnabled,
    isInMeeting,
    isPanelVisible,
    isSupportedPlatform,
  } = useCaptionStore();

  const {
    isAuthenticated,
  } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [statusMessage, setStatusMessage] = useState<string>("");
  // Mock data from external file
  const [records, setRecords] = useState<MockRecord[]>(mockData.records);
  const [user] = useState<MockUser>(mockData.user);
  const [profileSettings] = useState<MockProfileSettings>({
    ...mockData.profileSettings,
  });
  const [stats] = useState<MockStats>(mockData.stats);

  const handleDeleteRecord = (id: string) =>
    setRecords(records.filter((r) => r.id !== id));
  const handleSyncRecord = (id: string) =>
    setRecords(
      records.map((r) => (r.id === id ? { ...r, isSynced: true } : r))
    );

  const lastRecord = records.length > 0 ? records[0] : undefined;

  return (
    <div className="w-screen h-screen bg-secondary text-foreground flex flex-col">
      {/* // <div className="w-full h-full bg-secondary text-foreground flex flex-col"> */}
      <Header
        isActive={isExtensionEnabled}
        statusMessage={statusMessage}
        isSupported={isSupportedPlatform}
      />
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 overflow-y-auto scrollbar-thin overflow-x-hidden min-w-0">
        {activeTab === "home" && (
          <HomeTab
            state={state}
            error={error}
            isInMeeting={isInMeeting}
            isFloatPanelVisible={isPanelVisible}
            todayRecords={stats.thisWeekRecords}
            totalTime={stats.totalTime}
            lastRecord={lastRecord}
          />
        )}
        {activeTab === "records" && (
          <RecordsTab
            records={records}
            onViewRecord={() => {}}
            onExportRecord={() => {}}
            onDeleteRecord={handleDeleteRecord}
            onSyncRecord={handleSyncRecord}
          />
        )}
        {activeTab === "profile" && (
          <ProfileTab
            user={user}
            settings={profileSettings}
            stats={stats}
          />
        )}
      </div>
    </div>
  );
};

const handleRefreshToken = async () => {
  const { refreshToken } = useAuthStore.getState();
  await refreshToken();
};

export default PopupApp;
