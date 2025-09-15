import React, { useState, useEffect } from "react";
import { MessageType } from "../../../types/messages";

import { useCaptionStore } from "@/store/captionStore";
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
    isExtensionEnabled,
    isInitialized,
    isInMeeting,
    isPanelVisible,
    isRecording,
    isPaused,
    isSupportedPlatform,
    isError,

    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    hardStopRecording,
    toggleExtension,
    togglePanelVisibility,
  } = useCaptionStore();

  const {
    isAuthenticated,
    tokenExpiry,
    user: authUser,
    refreshToken,
  } = useAuthStore();

  // Mock extension store data
  const isActive = true;
  const settings = { theme: "light" as "light" | "dark" };
  const setActive = () => {};
  const setTheme = (theme: "light" | "dark") => {};

  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [statusMessage, setStatusMessage] = useState<string>("");

  // Встановлюємо statusMessage на основі isSupportedPlatform
  useEffect(() => {
    if (!isSupportedPlatform) {
      setStatusMessage(
        "This site is not supported. Please use Google Meet or Microsoft Teams."
      );
    } else {
      setStatusMessage("");
    }
  }, [isSupportedPlatform]);

  // Mock data from external file
  const [records, setRecords] = useState<MockRecord[]>(mockData.records);
  const [user] = useState<MockUser>(mockData.user);
  const [profileSettings, setProfileSettings] = useState<MockProfileSettings>({
    ...mockData.profileSettings,
    theme: settings.theme,
  });
  const [stats] = useState<MockStats>(mockData.stats);

  const handleDeleteRecord = (id: string) =>
    setRecords(records.filter((r) => r.id !== id));
  const handleSyncRecord = (id: string) =>
    setRecords(
      records.map((r) => (r.id === id ? { ...r, isSynced: true } : r))
    );

  const handleSettingChange = (key: string, value: any) => {
    setProfileSettings((prev) => ({ ...prev, [key]: value }));
    if (key === "theme") setTheme(value);
  };

  const handleExportData = () => {
    console.log("Export all data");
    // Export all data functionality
  };

  const lastRecord = records.length > 0 ? records[0] : undefined;

  return (
    <div className="w-screen h-screen bg-secondary text-foreground flex flex-col">
      {/* // <div className="w-full h-full bg-secondary text-foreground flex flex-col"> */}
      <Header
        isActive={isExtensionEnabled}
        onToggle={toggleExtension}
        statusMessage={statusMessage}
        isSupported={isSupportedPlatform}
      />
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 overflow-y-auto scrollbar-thin overflow-x-hidden min-w-0">
        {activeTab === "home" && (
          <HomeTab
            isRecording={isRecording}
            isPaused={isPaused}
            isInMeeting={isInMeeting}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onPauseRecording={pauseRecording}
            onResumeRecording={resumeRecording}
            onDeleteRecording={hardStopRecording}
            onToggleFloatPanel={togglePanelVisibility}
            isFloatPanelVisible={isPanelVisible}
            todayRecords={stats.thisWeekRecords}
            totalTime={stats.totalTime}
            lastRecord={lastRecord}
          />
        )}
        {activeTab === "records" && (
          <RecordsTab
            records={records}
            onViewRecord={(id) => console.log("View:", id)}
            onExportRecord={(id) => console.log("Export:", id)}
            onDeleteRecord={handleDeleteRecord}
            onSyncRecord={handleSyncRecord}
          />
        )}
        {activeTab === "profile" && (
          <ProfileTab
            user={user}
            settings={profileSettings}
            stats={stats}
            onSettingChange={handleSettingChange}
            onRefreshToken={handleRefreshToken}
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
