/**
 * Фабрика для створення адаптерів субтитрів
 * Автоматично визначає платформу та створює відповідний адаптер
 */

import { CaptionAdapter, GoogleMeetConfig, TeamsConfig } from "./types";
import { TranscriptonicAdapter } from "./adapters/TranscriptonicAdapter";
import { LiveCaptionsAdapter } from "./adapters/LiveCaptionsAdapter";
import { googleMeetConfig, teamsConfig } from "./config";

export type PlatformType = "google-meet" | "teams" | "unknown";

export interface AdapterFactoryConfig {
  autoEnableCaptions?: boolean;
  autoSaveOnEnd?: boolean;
  trackAttendees?: boolean;
  operationMode?: "manual" | "automatic";
}

export class AdapterFactory {
  private static instance: AdapterFactory;
  private currentAdapter: CaptionAdapter | null = null;

  private constructor() {}

  static getInstance(): AdapterFactory {
    if (!AdapterFactory.instance) {
      AdapterFactory.instance = new AdapterFactory();
    }
    return AdapterFactory.instance;
  }

  /**
   * Визначає поточну платформу на основі URL
   */
  detectPlatform(): PlatformType {
    const hostname = window.location.hostname.toLowerCase();

    if (hostname.includes("meet.google.com")) {
      return "google-meet";
    } else if (
      hostname.includes("teams.microsoft.com") ||
      hostname.includes("teams.live.com")
    ) {
      return "teams";
    }

    return "unknown";
  }

  /**
   * Створює адаптер для вказаної платформи
   */
  createAdapter(
    platform: PlatformType,
    config: AdapterFactoryConfig = {}
  ): CaptionAdapter | null {
    const defaultConfig = {
      autoEnableCaptions: true,
      autoSaveOnEnd: true,
      trackAttendees: true,
      operationMode: "automatic" as const,
      ...config,
    };

    switch (platform) {
      case "google-meet":
        // Використовуємо конфігурацію з config.ts
        const googleMeetConfigInstance: GoogleMeetConfig = {
          ...googleMeetConfig,
          ...defaultConfig,
          platform: "google-meet", // Явно вказуємо тип платформи
        };
        return new TranscriptonicAdapter(googleMeetConfigInstance);

      case "teams":
        // Використовуємо конфігурацію з config.ts
        const teamsConfigInstance: TeamsConfig = {
          ...teamsConfig,
          ...defaultConfig,
          platform: "teams", // Явно вказуємо тип платформи
        };
        return new LiveCaptionsAdapter(teamsConfigInstance);

      default:
        console.warn(`Unsupported platform: ${platform}`);
        return null;
    }
  }

  /**
   * Автоматично створює адаптер для поточної платформи
   */
  createAdapterForCurrentPlatform(
    config: AdapterFactoryConfig = {}
  ): CaptionAdapter | null {
    const platform = this.detectPlatform();
    return this.createAdapter(platform, config);
  }

  /**
   * Отримує поточний адаптер
   */
  getCurrentAdapter(): CaptionAdapter | null {
    return this.currentAdapter;
  }

  /**
   * Встановлює поточний адаптер
   */
  setCurrentAdapter(adapter: CaptionAdapter | null): void {
    this.currentAdapter = adapter;
  }

  /**
   * Очищає поточний адаптер
   */
  async cleanup(): Promise<void> {
    if (this.currentAdapter) {
      await this.currentAdapter.cleanup();
      this.currentAdapter = null;
    }
  }

  /**
   * Перевіряє, чи підтримується поточна платформа
   */
  isPlatformSupported(platform: PlatformType): boolean {
    return ["google-meet", "teams"].includes(platform);
  }

  /**
   * Отримує список підтримуваних платформ
   */
  getSupportedPlatforms(): PlatformType[] {
    return ["google-meet", "teams"];
  }

  /**
   * Отримує інформацію про платформу
   */
  getPlatformInfo(platform: PlatformType): {
    name: string;
    description: string;
    supported: boolean;
  } {
    const platformInfo = {
      "google-meet": {
        name: "Google Meet",
        description: "Google Meet video conferencing platform",
        supported: true,
      },
      teams: {
        name: "Microsoft Teams",
        description: "Microsoft Teams collaboration platform",
        supported: true,
      },
      unknown: {
        name: "Unknown",
        description: "Unknown or unsupported platform",
        supported: false,
      },
    };

    return platformInfo[platform] || platformInfo["unknown"];
  }
}
