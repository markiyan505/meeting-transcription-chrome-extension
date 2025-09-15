/**
 * Конфігурація для модуля зчитування субтитрів
 */

// Базова конфігурація
export const defaultConfig = {
  // Загальні налаштування
  autoEnableCaptions: true,
  autoSaveOnEnd: true,
  trackAttendees: true,
  operationMode: "automatic", // 'manual' | 'automatic'

  // Налаштування експорту
  export: {
    defaultFormat: "json",
    includeTimestamps: true,
    includeSpeakers: true,
    includeChatMessages: false,
    filenamePrefix: "meeting_transcript",
  },

  // Налаштування логування
  logging: {
    enabled: true,
    level: "info", // 'debug' | 'info' | 'warn' | 'error'
    showNotifications: true,
  },

  // Налаштування UI
  ui: {
    showStatusIndicator: true,
    notificationDuration: 5000,
    badgeUpdateInterval: 1000,
  },
};

// Конфігурація для Google Meet
export const googleMeetConfig = {
  ...defaultConfig,
  platform: "google-meet",

  // Базові селектори, які не змінюються між версіями UI
  baseSelectors: {
    captionsContainer: 'div[role="region"][tabindex="0"]',
    chatContainer: 'div[aria-live="polite"].Ge9Kpc',
    meetingTitle: ".u6vdEc",
    userName: ".awLEm",
  },

  // Налаштування для різних версій UI
  uiVersions: {
    1: {
      captionsButton: ".material-icons-extended",
      captionsButtonTextOn: "closed_caption",
      captionsButtonText: "closed_caption_off",
      leaveButton: ".google-material-icons",
      leaveButtonText: "call_end",
    },
    2: {
      captionsButton: ".google-symbols",
      captionsButtonTextOn: "closed_caption",
      captionsButtonText: "closed_caption_off",
      leaveButton: ".google-symbols",
      leaveButtonText: "call_end",
    },
  },
};

// Конфігурація для Microsoft Teams
export const teamsConfig = {
  ...defaultConfig,
  platform: "teams",
  autoOpenAttendees: true,

  // Специфічні налаштування для Teams
  selectors: {
    captionsContainer:
      "[data-tid='closed-caption-v2-window-wrapper'], [data-tid='closed-captions-renderer'], [data-tid*='closed-caption']",
    captionMessage: ".fui-ChatMessageCompact",
    captionAuthor: '[data-tid="author"]',
    captionText: '[data-tid="closed-caption-text"]',
    captionsButton: "div[id='closed-captions-button']",
    moreButton:
      "button[data-tid='more-button'], button[id='callingButtons-showMoreBtn']",
    languageSpeechButton: "div[id='LanguageSpeechMenuControl-id']",
    leaveButtons: [
      "button[data-tid='hangup-main-btn']",
      "button[data-tid='hangup-leave-button']",
      "button[data-tid='hangup-end-meeting-button']",
      "div#hangup-button button",
      "#hangup-button",
    ].join(","),
    chatContainer: "#chat-pane-list",
    chatMessage: ".fui-ChatMessageCompact",
    attendeesContainer: "[role='tree'][aria-label='Attendees']",
    attendeeItem: "[data-tid^='participantsInCall-']",
    attendeeName: "[id^='roster-avatar-img-']",
    attendeeRole: "[data-tid='ts-roster-organizer-status']",
    peopleButton:
      "button[data-tid='calling-toolbar-people-button'], button[id='roster-button']",
  },

  // Налаштування таймінгу
  timing: {
    buttonClickDelay: 400,
    retryDelay: 2000,
    mainLoopInterval: 5000,
    observerCheckInterval: 10000,
    attendeeUpdateInterval: 60000,
    initialAttendeeDelay: 1500,
  },
};

// Конфігурація для розробки
export const developmentConfig = {
  ...defaultConfig,
  logging: {
    enabled: true,
    level: "debug",
    showNotifications: true,
  },

  // Додаткові налаштування для розробки
  debug: {
    showConsoleLogs: true,
    showPerformanceMetrics: true,
    enableMockData: false,
  },
};

// Конфігурація для продакшену
export const productionConfig = {
  ...defaultConfig,
  logging: {
    enabled: true,
    level: "warn",
    showNotifications: true,
  },

  // Оптимізації для продакшену
  performance: {
    enableCaching: true,
    cacheExpiry: 5000,
    debounceDelay: 300,
    throttleDelay: 1000,
  },
};

// Функція для отримання конфігурації на основі платформи
export function getConfigForPlatform(
  platform: string,
  environment: string = "production"
) {
  const baseConfigs: Record<string, any> = {
    "google-meet": googleMeetConfig,
    teams: teamsConfig,
  };

  const environmentConfigs: Record<string, any> = {
    development: developmentConfig,
    production: productionConfig,
  };

  const baseConfig = baseConfigs[platform] || defaultConfig;
  const envConfig = environmentConfigs[environment] || productionConfig;

  return {
    ...baseConfig,
    ...envConfig,
    platform: platform,
  };
}

// Функція для отримання конфігурації на основі поточної платформи
export function getConfigForCurrentPlatform(environment = "production") {
  const hostname = window.location.hostname.toLowerCase();
  let platform = "unknown";

  if (hostname.includes("meet.google.com")) {
    platform = "google-meet";
  } else if (
    hostname.includes("teams.microsoft.com") ||
    hostname.includes("teams.live.com")
  ) {
    platform = "teams";
  }

  return getConfigForPlatform(platform, environment);
}

// Функція для валідації конфігурації
export function validateConfig(config: any) {
  const requiredFields = [
    "platform",
    "autoEnableCaptions",
    "autoSaveOnEnd",
    "trackAttendees",
  ];

  for (const field of requiredFields) {
    if (!(field in config)) {
      throw new Error(`Missing required configuration field: ${field}`);
    }
  }

  if (!["google-meet", "teams", "unknown"].includes(config.platform)) {
    throw new Error(`Unsupported platform: ${config.platform}`);
  }

  if (!["manual", "automatic"].includes(config.operationMode)) {
    throw new Error(`Invalid operation mode: ${config.operationMode}`);
  }

  return true;
}

// Функція для мержингу конфігурацій
export function mergeConfigs(baseConfig: any, userConfig: any) {
  return {
    ...baseConfig,
    ...userConfig,
    export: {
      ...baseConfig.export,
      ...userConfig.export,
    },
    logging: {
      ...baseConfig.logging,
      ...userConfig.logging,
    },
    ui: {
      ...baseConfig.ui,
      ...userConfig.ui,
    },
  };
}

// Експорт всіх конфігурацій
export const configs = {
  default: defaultConfig,
  googleMeet: googleMeetConfig,
  teams: teamsConfig,
  development: developmentConfig,
  production: productionConfig,
};
