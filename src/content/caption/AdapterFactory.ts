/**
 * Factory for creating caption adapters
 * Automatically detects platform and creates appropriate adapter
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
   * Detects the current platform based on the URL
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
   * Creates an adapter for the specified platform
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
        const googleMeetConfigInstance: GoogleMeetConfig = {
          ...googleMeetConfig,
          ...defaultConfig,
          platform: "google-meet",
        };
        return new TranscriptonicAdapter(googleMeetConfigInstance);

      case "teams":
        const teamsConfigInstance: TeamsConfig = {
          ...teamsConfig,
          ...defaultConfig,
          platform: "teams",
        };
        return new LiveCaptionsAdapter(teamsConfigInstance);

      default:
        console.warn(`Unsupported platform: ${platform}`);
        return null;
    }
  }

  /**
   * Automatically creates an adapter for the current platform
   */
  createAdapterForCurrentPlatform(
    config: AdapterFactoryConfig = {}
  ): CaptionAdapter | null {
    const platform = this.detectPlatform();
    return this.createAdapter(platform, config);
  }

  /**
   * Gets the current adapter
   */
  getCurrentAdapter(): CaptionAdapter | null {
    return this.currentAdapter;
  }

  /**
   * Sets the current adapter
   */
  setCurrentAdapter(adapter: CaptionAdapter | null): void {
    this.currentAdapter = adapter;
  }

  /**
   * Cleans up the current adapter
   */
  async cleanup(): Promise<void> {
    if (this.currentAdapter) {
      await this.currentAdapter.cleanup();
      this.currentAdapter = null;
    }
  }

  /**
   * Checks if the current platform is supported
   */
  isPlatformSupported(platform: PlatformType): boolean {
    return ["google-meet", "teams"].includes(platform);
  }

  /**
   * Gets the list of supported platforms
   */
  getSupportedPlatforms(): PlatformType[] {
    return ["google-meet", "teams"];
  }

  /**
   * Gets the information about the platform
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
