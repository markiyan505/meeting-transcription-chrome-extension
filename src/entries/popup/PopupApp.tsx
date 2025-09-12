import React, { useState, useEffect } from "react";
import { useExtensionStore } from "@/store/useExtensionStore";
import { useFloatPanelStore } from "@/store/useFloatPanelStore";
import Header from "./components/Header";
import Tabs, { TabType } from "./components/Tabs";
import HomeTab from "./components/HomeTab";
import RecordsTab from "./components/RecordsTab";
import ProfileTab from "./components/ProfileTab";

const PopupApp: React.FC = () => {
  const { isActive, settings, setActive, setTheme } = useExtensionStore();
  const { isVisible, show, hide } = useFloatPanelStore();

  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string>("");

  // Mock data based on existing interfaces
  const [records, setRecords] = useState([
    {
      id: "1",
      title: "Team Meeting - Project Discussion",
      time: "2024-01-15 14:30",
      duration: "1h 25m",
      platform: "google-meet" as const,
      isSynced: true,
      captionCount: 245,
      attendeeCount: 8,
    },
    {
      id: "2",
      title: "Client Presentation",
      time: "2024-01-14 10:15",
      duration: "45m",
      platform: "teams" as const,
      isSynced: false,
      captionCount: 180,
      attendeeCount: 5,
    },
    {
      id: "3",
      title: "Daily Standup",
      time: "2024-01-13 09:00",
      duration: "30m",
      platform: "google-meet" as const,
      isSynced: true,
      captionCount: 95,
      attendeeCount: 12,
    },
    {
      id: "4",
      title: "Sprint Planning",
      time: "2024-01-12 15:00",
      duration: "2h 10m",
      platform: "teams" as const,
      isSynced: true,
      captionCount: 320,
      attendeeCount: 15,
    },
    {
      id: "5",
      title: "Code Review Session",
      time: "2024-01-11 11:30",
      duration: "1h 15m",
      platform: "google-meet" as const,
      isSynced: false,
      captionCount: 150,
      attendeeCount: 6,
    },
  ]);

  const [user] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    avatar: undefined,
  });

  const [profileSettings, setProfileSettings] = useState({
    autoStart: false,
    autoEnableCaptions: true,
    allowAutoEnable: true,
    theme: settings.theme,
    notifications: true,
  });

  const [stats] = useState({
    totalRecords: 47,
    totalTime: "23h 45m",
    thisWeekRecords: 8,
    thisMonthRecords: 23,
  });

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

  const lastRecord = records.length > 0 ? records[0] : undefined;

  return (
    <div className="w-full h-full bg-secondary text-foreground flex flex-col">
      <Header
        isActive={isActive}
        onToggle={handleToggleActive}
        statusMessage={statusMessage}
        isSupported={isSupported}
      />
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 overflow-y-auto">
        {activeTab === "home" && (
          <HomeTab
            isRecording={isRecording}
            isPaused={isPaused}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onPauseRecording={handlePauseRecording}
            onResumeRecording={handleResumeRecording}
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
          />
        )}
      </div>
    </div>
  );
};

export default PopupApp;
