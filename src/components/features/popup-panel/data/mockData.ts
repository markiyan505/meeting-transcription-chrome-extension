/**
 * Mock data for popup panel components
 * This file contains all the mock data used in the popup panel for development and testing
 */

export interface MockRecord {
  id: string;
  title: string;
  time: string;
  duration: string;
  platform: "google-meet" | "teams";
  isSynced: boolean;
  captionCount: number;
  attendeeCount: number;
  messageCount: number;
}

export interface MockUser {
  name: string;
  email: string;
  avatar?: string;
}

export interface MockProfileSettings {
  autoStart: boolean;
  autoEnableCaptions: boolean;
  allowAutoEnable: boolean;
  theme: "light" | "dark";
  notifications: boolean;
}

export interface MockPlatformStats {
  totalMeetings: number;
  totalDuration: string;
  averageDuration: string;
}

export interface MockStats {
  totalRecords: number;
  totalTime: string;
  averageTime: string;
  thisWeekRecords: number;
  thisMonthRecords: number;
  platformStats: {
    googleMeet: MockPlatformStats;
    teams: MockPlatformStats;
  };
}

// Mock records data
export const mockRecords: MockRecord[] = [
  {
    id: "1",
    title: "Project Discussion",
    time: "2024-01-15 14:30",
    duration: "1h 25m",
    platform: "google-meet",
    isSynced: true,
    captionCount: 245,
    attendeeCount: 8,
    messageCount: 10,
  },
  {
    id: "2",
    title: "Client Presentation",
    time: "2024-01-14 10:15",
    duration: "45m",
    platform: "teams",
    isSynced: false,
    captionCount: 180,
    attendeeCount: 5,
    messageCount: 10,
  },
  {
    id: "3",
    title: "Daily Standup",
    time: "2024-01-13 09:00",
    duration: "30m",
    platform: "google-meet",
    isSynced: true,
    captionCount: 95,
    attendeeCount: 12,
    messageCount: 10,
  },
  {
    id: "4",
    title: "Sprint Planning",
    time: "2024-01-12 15:00",
    duration: "2h 10m",
    platform: "teams",
    isSynced: true,
    captionCount: 320,
    attendeeCount: 15,
    messageCount: 10,
  },
  {
    id: "5",
    title: "Code Review Session",
    time: "2024-01-11 11:30",
    duration: "1h 15m",
    platform: "google-meet",
    isSynced: false,
    captionCount: 150,
    attendeeCount: 6,
    messageCount: 10,
  },
  {
    id: "6",
    title: "Team Retrospective",
    time: "2024-01-10 16:00",
    duration: "1h 30m",
    platform: "google-meet",
    isSynced: true,
    captionCount: 280,
    attendeeCount: 10,
    messageCount: 15,
  },
  {
    id: "7",
    title: "Product Demo",
    time: "2024-01-09 14:00",
    duration: "1h 45m",
    platform: "teams",
    isSynced: true,
    captionCount: 420,
    attendeeCount: 20,
    messageCount: 25,
  },
  {
    id: "8",
    title: "Architecture Review",
    time: "2024-01-08 11:00",
    duration: "2h 30m",
    platform: "google-meet",
    isSynced: false,
    captionCount: 380,
    attendeeCount: 7,
    messageCount: 12,
  },
];

// Mock user data
export const mockUser: MockUser = {
  name: "John Doe",
  email: "john.doe@example.com",
  avatar: undefined,
};

// Mock profile settings
export const mockProfileSettings: MockProfileSettings = {
  autoStart: false,
  autoEnableCaptions: true,
  allowAutoEnable: true,
  theme: "light",
  notifications: true,
};

// Mock statistics data
export const mockStats: MockStats = {
  totalRecords: 47,
  totalTime: "23h 45m",
  averageTime: "1h 12m",
  thisWeekRecords: 8,
  thisMonthRecords: 23,
  platformStats: {
    googleMeet: {
      totalMeetings: 28,
      totalDuration: "14h 30m",
      averageDuration: "1h 15m",
    },
    teams: {
      totalMeetings: 19,
      totalDuration: "9h 15m",
      averageDuration: "1h 8m",
    },
  },
};

// Mock data for different scenarios
export const mockData = {
  records: mockRecords,
  user: mockUser,
  profileSettings: mockProfileSettings,
  stats: mockStats,
} as const;

// Helper functions for mock data
export const getMockRecordById = (id: string): MockRecord | undefined => {
  return mockRecords.find((record) => record.id === id);
};

export const getMockRecordsByPlatform = (
  platform: "google-meet" | "teams"
): MockRecord[] => {
  return mockRecords.filter((record) => record.platform === platform);
};

export const getMockRecordsByStatus = (isSynced: boolean): MockRecord[] => {
  return mockRecords.filter((record) => record.isSynced === isSynced);
};

export const getMockRecordsBySearch = (query: string): MockRecord[] => {
  const lowercaseQuery = query.toLowerCase();
  return mockRecords.filter(
    (record) =>
      record.title.toLowerCase().includes(lowercaseQuery) ||
      record.time.toLowerCase().includes(lowercaseQuery)
  );
};

// Mock data generators for testing
export const generateMockRecord = (
  overrides: Partial<MockRecord> = {}
): MockRecord => {
  const baseRecord: MockRecord = {
    id: Math.random().toString(36).substr(2, 9),
    title: "Mock Meeting",
    time: new Date().toISOString(),
    duration: "1h 0m",
    platform: "google-meet",
    isSynced: false,
    captionCount: 100,
    attendeeCount: 5,
    messageCount: 5,
  };

  return { ...baseRecord, ...overrides };
};

export const generateMockStats = (
  overrides: Partial<MockStats> = {}
): MockStats => {
  const baseStats: MockStats = {
    totalRecords: 0,
    totalTime: "0h 0m",
    averageTime: "0h 0m",
    thisWeekRecords: 0,
    thisMonthRecords: 0,
    platformStats: {
      googleMeet: {
        totalMeetings: 0,
        totalDuration: "0h 0m",
        averageDuration: "0h 0m",
      },
      teams: {
        totalMeetings: 0,
        totalDuration: "0h 0m",
        averageDuration: "0h 0m",
      },
    },
  };

  return { ...baseStats, ...overrides };
};

// Configuration for statistics cards
export interface StatisticsCardConfig {
  key: string;
  value: string | number;
  label: string;
  variant: "default" | "outline";
}

export interface PlatformCardConfig {
  key: string;
  name: string;
  data: MockPlatformStats;
}

// Statistics cards configuration
export const statisticsCardsConfig: StatisticsCardConfig[] = [
  {
    key: "totalRecords",
    value: mockStats.totalRecords,
    label: "Total Records",
    variant: "default",
  },
  {
    key: "totalTime",
    value: mockStats.totalTime,
    label: "Total Time",
    variant: "default",
  },
  {
    key: "thisWeekRecords",
    value: mockStats.thisWeekRecords,
    label: "This Week",
    variant: "outline",
  },
  {
    key: "averageTime",
    value: mockStats.averageTime,
    label: "Average Time",
    variant: "outline",
  },
];

// Platform breakdown configuration
export const platformCardsConfig: PlatformCardConfig[] = [
  {
    key: "googleMeet",
    name: "Google Meet",
    data: mockStats.platformStats.googleMeet,
  },
  {
    key: "teams",
    name: "Microsoft Teams",
    data: mockStats.platformStats.teams,
  },
];

// Quick stats configuration for HomeTab
export interface QuickStatsConfig {
  icon: string;
  label: string;
  value: string | number;
  variant: "default" | "outline";
}

export const quickStatsConfig: QuickStatsConfig[] = [
  {
    icon: "Clock",
    label: "Today",
    value: `${mockStats.thisWeekRecords} records`,
    variant: "outline",
  },
  {
    icon: "Clock",
    label: "This week",
    value: `${mockStats.thisWeekRecords} records`,
    variant: "outline",
  },
];
