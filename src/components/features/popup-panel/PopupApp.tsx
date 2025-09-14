import React, { useState, useEffect } from "react";
import { useExtensionStore } from "@/store/useExtensionStore";
import { useFloatPanelStore } from "@/store/useFloatPanelStore";

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
  const { isActive, settings, setActive, setTheme } = useExtensionStore();
  const { isVisible, show, hide } = useFloatPanelStore();

  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string>("");

  // Mock data from external file
  const [records, setRecords] = useState<MockRecord[]>(mockData.records);
  const [user] = useState<MockUser>(mockData.user);
  const [profileSettings, setProfileSettings] = useState<MockProfileSettings>({
    ...mockData.profileSettings,
    theme: settings.theme,
  });
  const [stats] = useState<MockStats>(mockData.stats);

  useEffect(() => {
    const checkSiteSupport = async () => {
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (tab.url) {
          const isGoogleMeet = tab.url.includes("meet.google.com");
          const isTeams =
            tab.url.includes("teams.microsoft.com") ||
            tab.url.includes("teams.live.com");

          if (isGoogleMeet || isTeams) {
            setIsSupported(true);
            setStatusMessage("");
          } else {
            setIsSupported(false);
            setStatusMessage(
              "This site is not supported. Extension works only with Google Meet and Microsoft Teams."
            );
          }
        }
      } catch (error) {
        console.error("Error checking site support:", error);
        setIsSupported(false);
        setStatusMessage("Failed to determine site support.");
      }
    };

    checkSiteSupport();
  }, []);

  const handleToggleActive = () => setActive(!isActive);
  const handleToggleFloatPanel = () => (isVisible ? hide() : show());

  // Handlers for recording actions
  const createMessageHandler = (action: string) => async () => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab.id) {
        await chrome.tabs.sendMessage(tab.id, { type: action });
        if (action === "start_caption_recording") {
          setIsRecording(true);
          setIsPaused(false);
        } else if (action === "stop_caption_recording") {
          setIsRecording(false);
          setIsPaused(false);
        } else if (action === "pause_caption_recording") {
          setIsPaused(true);
        } else if (action === "resume_caption_recording") {
          setIsPaused(false);
        } else if (action === "delete_caption_recording") {
          setIsRecording(false);
          setIsPaused(false);
        }
      }
    } catch (error) {
      console.error(`Error with action ${action}:`, error);
    }
  };

  const handleStartRecording = createMessageHandler("start_caption_recording");
  const handleStopRecording = createMessageHandler("stop_caption_recording");
  const handlePauseRecording = createMessageHandler("pause_caption_recording");
  const handleResumeRecording = createMessageHandler(
    "resume_caption_recording"
  );
  const handleDeleteRecording = createMessageHandler(
    "delete_caption_recording"
  );

  // Handlers for records
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

  const handleRefreshToken = () => {
    console.log("Refresh token");
    // Open auth URL for token refresh
    window.open("https://auth.example.com/refresh", "_blank");
  };

  const lastRecord = records.length > 0 ? records[0] : undefined;

  return (
    // <div className="w-screen h-screen bg-secondary text-foreground flex flex-col">
    <div className="w-full h-full bg-secondary text-foreground flex flex-col">
      <Header
        isActive={isActive}
        onToggle={handleToggleActive}
        statusMessage={statusMessage}
        isSupported={isSupported}
      />
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 overflow-y-auto scrollbar-thin overflow-x-hidden min-w-0">
        {activeTab === "home" && (
          <HomeTab
            isRecording={isRecording}
            isPaused={isPaused}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onPauseRecording={handlePauseRecording}
            onResumeRecording={handleResumeRecording}
            onDeleteRecording={handleDeleteRecording}
            onToggleFloatPanel={handleToggleFloatPanel}
            isFloatPanelVisible={isVisible}
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
            onExportData={handleExportData}
            onRefreshToken={handleRefreshToken}
          />
        )}
      </div>
    </div>
  );
};

export default PopupApp;
