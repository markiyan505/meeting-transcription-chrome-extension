/**
 * Адаптер для live-captions-saver (Microsoft Teams)
 * Успадковується від BaseAdapter і реалізує логіку, специфічну для Microsoft Teams.
 */

import { OperationResult, TeamsConfig, CaptionEntry } from "../types";
import { BaseAdapter } from "./BaseAdapter";

interface AttendeeEvent {
  name: string;
  role?: string;
  action: "joined" | "left";
  time: string;
}

interface AttendeeState {
  allAttendees: Set<string>;
  currentAttendees: Map<string, string>;
  attendeeHistory: AttendeeEvent[];
}

export class LiveCaptionsAdapter extends BaseAdapter {
  protected config: TeamsConfig;
  private selectors: any;

  // Стан спостерігачів, специфічний для Teams
  private observers: { [key: string]: MutationObserver } = {};

  // Кеш елементів для підвищення продуктивності
  private cachedElements = new Map<
    string,
    { element: Element; timestamp: number }
  >();

  private attendeeState: AttendeeState = {
    allAttendees: new Set(),
    currentAttendees: new Map(),
    attendeeHistory: [],
  };
  private autoEnableInProgress: boolean = false;

  constructor(config: TeamsConfig) {
    super(config);
    this.config = config;
    this.selectors = config.selectors;
  }

  // --- Реалізація абстрактних методів з BaseAdapter ---

  async initialize(): Promise<OperationResult> {
    try {
      if (!this.isTeamsPage()) {
        return { success: false, error: "Not on a Microsoft Teams page" };
      }
      // this.setupMeetingDetection();
      this.setupMeetingStateObserver();
      await this.updateMeetingInfo();

      this.isInitialized = true;
      this.emit("initialized", { platform: "teams" });

      return {
        success: true,
        message: "LiveCaptionsAdapter initialized successfully",
      };
    } catch (error) {
      return { success: false, error: `Failed to initialize: ${error}` };
    }
  }

  async isCaptionsEnabled(): Promise<boolean> {
    // if (!(await this.isCaptionsButtonAvailable())) {
    //   console.log("Captions button not available");
    //   return false;
    // }
    return this.getCachedElement(this.selectors.captionsContainer) !== null;
  }

  async isInMeeting(): Promise<boolean> {
    return this.getCachedElement(this.selectors.leaveButtons) !== null;
  }

  async enableCaptions(): Promise<OperationResult> {
    try {
      if (await this.isCaptionsEnabled()) {
        return { success: true, message: "Captions are already enabled" };
      }
      const result = await this.attemptAutoEnableCaptions(true);
      if (result.success) {
        this.emit("captions_enabled", { timestamp: new Date().toISOString() });
      }
      return result;
    } catch (error) {
      this.emit("error", { context: "enable_captions", error });
      return { success: false, error: `Failed to enable captions: ${error}` };
    }
  }

  async disableCaptions(): Promise<OperationResult> {
    if (this.autoEnableInProgress) {
      return { success: false, error: "Auto-enable is already in progress." };
    }
    try {
      if (!(await this.isCaptionsEnabled())) {
        return { success: true, message: "Captions are already disabled" };
      }
      const result = await this.attemptAutoEnableCaptions(false);
      if (result.success) {
        this.emit("captions_disabled", { timestamp: new Date().toISOString() });
      }
      return result;
    } catch (error) {
      this.emit("error", { context: "disable_captions", error });
      return { success: false, error: `Failed to enable captions: ${error}` };
    }
  }

  async isCaptionsButtonAvailable(): Promise<boolean> {
    try {
      const button = document.querySelector(this.selectors.captionsButton);
      return !!button;
    } catch (error) {
      console.error(
        "Error while checking if captions button is available:",
        error
      );
      return false;
    }
  }

  async cleanup(): Promise<OperationResult> {
    this.cleanupPlatformObservers();
    this.eventListeners.clear();
    this.cachedElements.clear();
    this.isInitialized = false;
    return { success: true, message: "Cleanup completed successfully" };
  }

  // --- Реалізація захищених методів для управління спостерігачами ---

  private async tryOpenParticipantPanel(): Promise<boolean> {
    if (!this.config.autoOpenAttendees) return true;

    try {
      const peopleButton = this.getCachedElement(
        this.selectors.peopleButton
      ) as HTMLElement;
      if (
        peopleButton &&
        peopleButton.getAttribute("aria-pressed") !== "true"
      ) {
        console.log("Attempting to open participant panel...");
        peopleButton.click();
        await this.delay(500);
      }
      return true;
    } catch (error) {
      this.emit("error", { context: "open_participants", error });
      return false;
    }
  }

  private async updateAttendees(): Promise<void> {
    await this.tryOpenParticipantPanel();

    try {
      const attendeesContainer = this.getCachedElement(
        this.selectors.attendeesContainer
      );
      if (!attendeesContainer) return;

      const newAttendees = new Map<string, string>();
      attendeesContainer
        .querySelectorAll(this.selectors.attendeeItem)
        .forEach((item) => {
          const nameElement = item.querySelector(this.selectors.attendeeName);
          const roleElement = item.querySelector(this.selectors.attendeeRole);
          if (nameElement) {
            const name = nameElement.textContent?.trim() || "Unknown";
            const role = roleElement?.textContent?.trim() || "Attendee";
            newAttendees.set(name, role);
          }
        });

      const currentTime = new Date().toISOString();
      const previousAttendees = this.attendeeState.currentAttendees;

      // Визначаємо, хто зайшов
      newAttendees.forEach((role, name) => {
        if (!previousAttendees.has(name)) {
          this.attendeeState.attendeeHistory.push({
            name,
            role,
            action: "joined",
            time: currentTime,
          });
          this.attendeeState.allAttendees.add(name);
        }
      });

      // Визначаємо, хто вийшов
      previousAttendees.forEach((role, name) => {
        if (!newAttendees.has(name)) {
          this.attendeeState.attendeeHistory.push({
            name,
            action: "left",
            time: currentTime,
          });
        }
      });

      this.attendeeState.currentAttendees = newAttendees;
      this.meetingInfo.attendees = Array.from(this.attendeeState.allAttendees);

      this.emit("attendees_updated", this.attendeeState);
    } catch (error) {
      this.emit("error", { context: "update_attendees", error });
      console.error("Error updating attendees:", error);
    }
  }

  protected setupPlatformObservers(): void {
    this.setupCaptionObserver();
    this.setupChatObserver();
    if (this.config.trackAttendees) {
      this.setupAttendeeObserver();
    }
  }

  protected cleanupPlatformObservers(): void {
    Object.values(this.observers).forEach((observer) => observer.disconnect());
    this.observers = {};
  }

  // --- Приватні методи, специфічні для Teams ---

  private isTeamsPage(): boolean {
    const hostname = window.location.hostname;
    return (
      hostname.includes("teams.microsoft.com") ||
      hostname.includes("teams.live.com")
    );
  }

  // private setupMeetingDetection(): void {
  //   const checkMeetingStatus = async () => {
  //     const inMeeting = await this.isInMeeting();
  //     if (inMeeting && !this.meetingInfo.startTime) {
  //       this.meetingInfo.startTime = new Date().toISOString();
  //       this.emit("meeting_started", { timestamp: this.meetingInfo.startTime });
  //     }
  //   };
  //   setInterval(checkMeetingStatus, 5000);
  //   checkMeetingStatus();
  // }

  private async updateMeetingInfo(): Promise<void> {
    this.meetingInfo.title = document.title;
    if (this.config.trackAttendees) {
      await this.updateAttendees();
    }
  }

  private async attemptAutoEnableCaptions(
    enable: boolean = true
  ): Promise<OperationResult> {
    try {
      // Перевіряємо поточний стан перед дією
      const currentlyEnabled = await this.isCaptionsEnabled();
      if (enable && currentlyEnabled) {
        return { success: true, message: "Captions already enabled" };
      }
      if (!enable && !currentlyEnabled) {
        return { success: true, message: "Captions already disabled" };
      }

      const moreButton = this.getCachedElement(
        this.selectors.moreButton
      ) as HTMLElement;
      if (!moreButton)
        return { success: false, error: "More button not found" };
      moreButton.click();
      await this.delay(400);

      const langButton = this.getCachedElement(
        this.selectors.languageSpeechButton
      ) as HTMLElement;
      if (!langButton)
        return { success: false, error: "Language button not found" };
      langButton.click();
      await this.delay(400);

      const captionsButton = this.getCachedElement(
        this.selectors.captionsButton
      ) as HTMLElement;
      if (!captionsButton)
        return { success: false, error: "Captions button not found" };
      captionsButton.click();
      await this.delay(400);

      return {
        success: true,
        message: `Captions ${enable ? "enabled" : "disabled"} successfully`,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to auto-toggle captions: ${error}`,
      };
    }
  }

  private setupCaptionObserver(): void {
    const container = this.getCachedElement(this.selectors.captionsContainer);
    if (!container) {
      console.warn("Captions container not found. Observer not set.");
      return;
    }
    const observer = new MutationObserver(() => {
      if (!this.isPaused) this.processCaptionUpdates();
    });
    observer.observe(container, { childList: true, subtree: true });
    this.observers.captionObserver = observer;
  }

  private setupChatObserver(): void {
    const container = this.getCachedElement(this.selectors.chatContainer);
    if (!container) return;
    const observer = new MutationObserver(() => {
      if (!this.isPaused) this.processChatUpdates();
    });
    observer.observe(container, { childList: true, subtree: true });
    this.observers.chatObserver = observer;
  }

  private setupAttendeeObserver(): void {
    const container = this.getCachedElement(this.selectors.attendeesContainer);
    if (!container) return;
    const observer = new MutationObserver(() => this.updateAttendees());
    observer.observe(container, { childList: true, subtree: true });
    this.observers.attendeeObserver = observer;
  }

  private processCaptionUpdates(): void {
    const container = this.getCachedElement(this.selectors.captionsContainer);
    if (!container) return;

    container
      .querySelectorAll(this.selectors.captionMessage)
      .forEach((element) => {
        try {
          const author =
            element
              .querySelector(this.selectors.captionAuthor)
              ?.textContent?.trim() || "Unknown";
          const text =
            element
              .querySelector(this.selectors.captionText)
              ?.textContent?.trim() || "";

          if (!text) return;

          let captionId = element.getAttribute("data-caption-id");
          if (!captionId) {
            captionId = `caption_${Date.now()}_${Math.random()}`;
            element.setAttribute("data-caption-id", captionId);
          }

          const existing = this.captions.find((c) => c.id === captionId);
          if (existing) {
            if (existing.text !== text) {
              existing.text = text;
              existing.timestamp = new Date().toISOString();
              this.emit("caption_updated", existing);
            }
          } else {
            const newCaption: CaptionEntry = {
              id: captionId,
              speaker: author,
              text,
              timestamp: new Date().toISOString(),
            };
            this.captions.push(newCaption);
            this.emit("caption_added", newCaption);
          }
        } catch (error) {
          console.error("Error processing a caption element:", error);
        }
      });
  }

  private processChatUpdates(): void {
    // Тут має бути логіка обробки повідомлень чату для Teams.
    // Наприклад, зчитування останнього повідомлення та додавання його до масиву this.chatMessages.
  }

  private getCachedElement(selector: string, expiry = 5000): Element | null {
    const now = Date.now();
    const cached = this.cachedElements.get(selector);

    if (
      cached &&
      now - cached.timestamp < expiry &&
      document.body.contains(cached.element)
    ) {
      return cached.element;
    }

    const element = document.querySelector(selector);
    if (element) {
      this.cachedElements.set(selector, { element, timestamp: now });
    }
    return element;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
