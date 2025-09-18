/**
 * Адаптер для live-captions-saver (Microsoft Teams)
 * Успадковується від BaseAdapter і реалізує логіку, специфічну для Microsoft Teams.
 */

import {
  OperationResult,
  TeamsConfig,
  CaptionEntry,
  ChatMessage,
} from "../types";
import { BaseAdapter } from "./BaseAdapter";
import { AttendeeEvent } from "@/types/session";
import { ErrorHandler } from "../utils/originalUtils";

interface AttendeeState {
  allAttendees: Set<string>;
  currentAttendees: Map<string, string>;
  attendeeHistory: AttendeeEvent[];
}

export class LiveCaptionsAdapter extends BaseAdapter {
  protected config: TeamsConfig;
  private selectors: any;

  private observers: { [key: string]: MutationObserver } = {};

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

  async initialize(): Promise<OperationResult> {
    if (!this.isTeamsPage()) {
      return { success: false, error: "Not on a Microsoft Teams page" };
    }
    this.setupMeetingStateObserver();
    // await this.updateMeetingInfo();

    this.isInitialized = true;
    this.emit("initialized", { platform: "teams" });

    return {
      success: true,
      message: "LiveCaptionsAdapter initialized successfully",
    };
  }

  async isCaptionsEnabled(): Promise<boolean> {
    return this.getCachedElement(this.selectors.captionsContainer) !== null;
  }

  async isInMeeting(): Promise<boolean> {
    return this.getCachedElement(this.selectors.leaveButtons) !== null;
  }

  async enableCaptions(): Promise<OperationResult> {
    const result = await this.attemptAutoEnableCaptions(true);
    if (result.success) {
      this.emit("captions_enabled", { timestamp: new Date().toISOString() });
    }
    return result;
  }

  async disableCaptions(): Promise<OperationResult> {
    const result = await this.attemptAutoEnableCaptions(false);
    if (result.success) {
      this.emit("captions_disabled", { timestamp: new Date().toISOString() });
    }
    return result;
  }

  async startRecording(): Promise<OperationResult> {
    const result = await super.startRecording();
    // if (result.success && this.config.trackAttendees) {
    //   this.startAttendeeTracking();
    // }
    return result;
  }

  async stopRecording(): Promise<OperationResult> {
    // this.stopAttendeeTracking();
    this.updateMeetingInfo();
    this.emit("meeting_info_changed", this.getMeetingInfo());

    return super.stopRecording();
  }

  async cleanup(): Promise<OperationResult> {
    // this.stopAttendeeTracking();
    this.cleanupPlatformObservers();
    this.eventListeners.clear();
    this.cachedElements.clear();
    this.isInitialized = false;
    return { success: true, message: "Cleanup completed successfully" };
  }

  // private async tryOpenParticipantPanel(): Promise<boolean> {
  //   if (!this.config.autoOpenAttendees) return true;

  //   try {
  //     const peopleButton = this.getCachedElement(
  //       this.selectors.peopleButton
  //     ) as HTMLElement;
  //     if (
  //       peopleButton &&
  //       peopleButton.getAttribute("aria-pressed") !== "true"
  //     ) {
  //       peopleButton.click();
  //       await this.delay(500);
  //     }
  //     return true;
  //   } catch (error) {
  //     this.emit("error", { context: "open_participants", error });
  //     return false;
  //   }
  // }

  // private async updateAttendees(): Promise<void> {
  //   try {
  //     await this.tryOpenParticipantPanel();

  //     const attendeesContainer = this.getCachedElement(
  //       this.selectors.attendeesContainer
  //     );
  //     if (!attendeesContainer) {
  //       this.updateAttendeesFromTranscript();
  //       return;
  //     }

  //     const attendeeItems = attendeesContainer.querySelectorAll(
  //       this.selectors.attendeeItem
  //     );
  //     const currentAttendees = new Map<string, string>();

  //     attendeeItems.forEach((item) => {
  //       try {
  //         const nameElement = item.querySelector(this.selectors.attendeeName);
  //         const roleElement = item.querySelector(this.selectors.attendeeRole);

  //         if (nameElement) {
  //           const name =
  //             nameElement.getAttribute("alt") ||
  //             nameElement.textContent?.trim() ||
  //             "Unknown";
  //           const role = roleElement ? "Organizer" : "Participant";

  //           currentAttendees.set(name, role);

  //           if (!this.attendeeState.allAttendees.has(name)) {
  //             this.attendeeState.allAttendees.add(name);
  //             this.attendeeState.attendeeHistory.push({
  //               name,
  //               role,
  //               action: "joined",
  //               time: new Date().toLocaleTimeString(),
  //             });
  //           }
  //         }
  //       } catch (error) {
  //         ErrorHandler.log(error as Error, "Processing attendee item", true);
  //       }
  //     });

  //     // Відстеження виходу учасників
  //     for (const [name, role] of this.attendeeState.currentAttendees) {
  //       if (!currentAttendees.has(name)) {
  //         this.attendeeState.attendeeHistory.push({
  //           name,
  //           role,
  //           action: "left",
  //           time: new Date().toLocaleTimeString(),
  //         });
  //       }
  //     }

  //     this.attendeeState.currentAttendees = currentAttendees;
  //     this.meetingInfo.attendees = Array.from(this.attendeeState.allAttendees);

  //     this.emit("attendees_updated", this.attendeeState);
  //   } catch (error) {
  //     console.warn(
  //       "Failed to update attendees, falling back to transcript method:",
  //       error
  //     );
  //     this.updateAttendeesFromTranscript();
  //   }
  // }

  // async getAttendeeReport(): Promise<any> {
  //   if (!this.config.trackAttendees) {
  //     return null;
  //   }

  //   return {
  //     meetingStartTime: this.meetingInfo.startTime,
  //     lastUpdated: new Date().toISOString(),
  //     totalUniqueAttendees: this.attendeeState.allAttendees.size,
  //     currentAttendeeCount: this.attendeeState.currentAttendees.size,
  //     attendeeList: Array.from(this.attendeeState.allAttendees),
  //     currentAttendees: Array.from(
  //       this.attendeeState.currentAttendees.entries()
  //     ).map(([name, role]) => ({
  //       name,
  //       role,
  //     })),
  //     attendeeHistory: this.attendeeState.attendeeHistory,
  //   };
  // }

  protected setupPlatformObservers(): void {
    this.setupCaptionObserver();
    // this.setupChatObserver();
    // if (this.config.trackAttendees) {
    // this.setupAttendeeObserver();
    // }
  }

  private attendeeUpdateInterval: ReturnType<typeof setInterval> | null = null;

  protected cleanupPlatformObservers(): void {
    if (this.autoEnableDebounceTimer) {
      clearTimeout(this.autoEnableDebounceTimer);
    }

    Object.values(this.observers).forEach((observer) => observer.disconnect());
    this.observers = {};

    this.cachedElements.clear();

    this.isInitialized = false;
  }

  private isTeamsPage(): boolean {
    const hostname = window.location.hostname;
    return (
      hostname.includes("teams.microsoft.com") ||
      hostname.includes("teams.live.com")
    );
  }

  private async updateMeetingInfo(): Promise<void> {
    this.meetingInfo.title = document.title;
    // if (this.config.trackAttendees) {
    //   await this.updateAttendees();
    // }
  }

  private async attemptAutoEnableCaptions(
    enable: boolean = true
  ): Promise<OperationResult> {
    const now = Date.now();

    // Дебаунсинг для запобігання спаму кліків
    if (now - this.autoEnableLastAttempt < this.TIMING.RETRY_DELAY) {
      return { success: false, error: "Too soon since last attempt" };
    }

    this.autoEnableLastAttempt = now;

    if (this.autoEnableInProgress) {
      return { success: false, error: "Auto-enable already in progress" };
    }

    this.autoEnableInProgress = true;

    try {
      const currentlyEnabled = await this.isCaptionsEnabled();

      if (enable && currentlyEnabled) {
        return { success: true, message: "Captions already enabled" };
      }

      if (!enable && !currentlyEnabled) {
        return { success: true, message: "Captions already disabled" };
      }

      // Оригінальна логіка кліків по кнопках Teams
      const moreButton = this.getCachedElement(
        this.selectors.moreButton
      ) as HTMLElement;
      if (!moreButton) {
        return { success: false, error: "More button not found" };
      }

      moreButton.click();
      await this.delay(this.TIMING.BUTTON_CLICK_DELAY);

      const langButton = this.getCachedElement(
        this.selectors.languageSpeechButton
      ) as HTMLElement;
      if (!langButton) {
        return { success: false, error: "Language button not found" };
      }

      langButton.click();
      await this.delay(this.TIMING.BUTTON_CLICK_DELAY);

      const captionsButton = this.getCachedElement(
        this.selectors.captionsButton
      ) as HTMLElement;
      if (!captionsButton) {
        return { success: false, error: "Captions button not found" };
      }

      captionsButton.click();
      await this.delay(this.TIMING.BUTTON_CLICK_DELAY);

      // Перевірка успішності
      const finalCheck = await this.isCaptionsEnabled();
      if (enable && !finalCheck) {
        return {
          success: false,
          error: "Failed to enable captions after attempt",
        };
      }

      if (!enable && finalCheck) {
        return {
          success: false,
          error: "Failed to disable captions after attempt",
        };
      }

      return {
        success: true,
        message: `Captions ${enable ? "enabled" : "disabled"} successfully`,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to auto-toggle captions: ${error}`,
      };
    } finally {
      this.autoEnableInProgress = false;
    }
  }

  private autoEnableLastAttempt: number = 0;
  private autoEnableDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  private setupCaptionObserver(): void {
    const container = this.getCachedElement(this.selectors.captionsContainer);
    if (!container) return;

    const debouncedProcessCaptionUpdates = this.debounce(
      this.processCaptionUpdates.bind(this),
      300
    );

    const observer = new MutationObserver(
      this.safeWrap(debouncedProcessCaptionUpdates, "teams_caption_observer")
    );
    observer.observe(container, { childList: true, subtree: true });
    this.observers.captionObserver = observer;
  }

  // private setupChatObserver(): void {
  //   const container = this.getCachedElement(this.selectors.chatContainer);
  //   if (!container) return;

  //   const debouncedProcessChatUpdates = this.debounce(
  //     this.processChatUpdates.bind(this),
  //     500
  //   );

  //   const observer = new MutationObserver(() => {
  //     if (!this.isPaused) debouncedProcessChatUpdates();
  //   });
  //   observer.observe(container, { childList: true, subtree: true });
  //   this.observers.chatObserver = observer;
  // }

  // private startAttendeeTracking(): void {
  //   if (this.attendeeUpdateInterval) {
  //     clearInterval(this.attendeeUpdateInterval);
  //   }

  //   // Початкове оновлення через 1.5 секунди
  //   setTimeout(() => {
  //     this.updateAttendees();
  //     // Оновлення кожну хвилину
  //     this.attendeeUpdateInterval = setInterval(
  //       () => this.updateAttendees(),
  //       60000 // 1 хвилина
  //     );
  //   }, 1500);
  // }

  // private updateAttendeesFromTranscript(): void {
  //   // Fallback: витягуємо спікерів з субтитрів
  //   const speakers = [
  //     ...new Set(this.captions.map((caption) => caption.speaker)),
  //   ];
  //   const currentTime = new Date().toISOString();

  //   speakers.forEach((name) => {
  //     if (!this.attendeeState.allAttendees.has(name)) {
  //       this.attendeeState.allAttendees.add(name);
  //       this.attendeeState.currentAttendees.set(name, "Speaker");

  //       this.attendeeState.attendeeHistory.push({
  //         name,
  //         role: "Speaker",
  //         action: "joined",
  //         time: currentTime,
  //       });
  //     }
  //   });

  //   this.meetingInfo.attendees = Array.from(this.attendeeState.allAttendees);
  //   this.emit("attendees_updated", this.attendeeState);
  // }

  // private stopAttendeeTracking(): void {
  //   if (this.attendeeUpdateInterval) {
  //     clearInterval(this.attendeeUpdateInterval);
  //     this.attendeeUpdateInterval = null;
  //   }
  // }

  // private setupAttendeeObserver(): void {
  //   const container = this.getCachedElement(this.selectors.attendeesContainer);
  //   if (!container) {
  //     console.warn(
  //       "Attendees container not found, attendee tracking will use fallback method"
  //     );
  //     return;
  //   }

  //   const debouncedUpdateAttendees = this.debounce(
  //     this.updateAttendees.bind(this),
  //     1000
  //   );

  //   const observer = new MutationObserver(() => debouncedUpdateAttendees());
  //   observer.observe(container, { childList: true, subtree: true });
  //   this.observers.attendeeObserver = observer;
  // }

  private processCaptionUpdates(): void {
    const container = this.getCachedElement(this.selectors.captionsContainer);
    if (!container) {
      console.log("[LiveCaptionsAdapter] No captions container found");
      return;
    }

    console.log(
      "[LiveCaptionsAdapter] Processing caption updates, container:",
      container
    );

    const captionElements = container.querySelectorAll(
      this.selectors.captionMessage
    );
    console.log(
      "[LiveCaptionsAdapter] Found caption elements:",
      captionElements.length
    );

    captionElements.forEach((element) => {
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
        console.log("[LiveCaptionsAdapter] Caption ID:", captionId);
        if (!captionId || captionId === "") {
          console.log(
            "[LiveCaptionsAdapter] Caption ID is empty, generating new one"
          );
          captionId = `caption_${Date.now()}_${Math.random()}`;
          element.setAttribute("data-caption-id", captionId);
          console.log(
            "[LiveCaptionsAdapter] Caption ID generated:",
            captionId,
            "for element:",
            element.getAttribute("data-caption-id")
          );
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

  // private processChatUpdates = (): void => {
  //   const chatContainer = this.getCachedElement(this.selectors.chatContainer);
  //   if (!chatContainer) return;

  //   const chatElements = chatContainer.querySelectorAll(
  //     this.selectors.chatMessage
  //   );

  //   chatElements.forEach((element) => {
  //     try {
  //       const authorElement = element.querySelector(
  //         this.selectors.captionAuthor
  //       );
  //       const textElement = element.querySelector(this.selectors.captionText);

  //       if (!authorElement || !textElement) return;

  //       const name = authorElement.textContent?.trim() || "Unknown";
  //       const text = textElement.textContent?.trim() || "";

  //       if (text.length === 0) return;

  //       let chatId = element.getAttribute("data-chat-id");
  //       if (!chatId) {
  //         chatId = `chat_${Date.now()}_${Math.random()
  //           .toString(36)
  //           .substring(2, 9)}`;
  //         element.setAttribute("data-chat-id", chatId);
  //       }

  //       const existingIndex = this.chatMessages.findIndex(
  //         (entry) => entry.id === chatId
  //       );
  //       const time = new Date().toISOString();

  //       if (existingIndex !== -1) {
  //         // Оновлення існуючого повідомлення чату
  //         if (this.chatMessages[existingIndex].message !== text) {
  //           this.chatMessages[existingIndex].message = text;
  //           this.chatMessages[existingIndex].timestamp = time;
  //           this.emit("chat_message_updated", this.chatMessages[existingIndex]);
  //         }
  //       } else {
  //         // Додавання нового повідомлення чату
  //         const newChatMessage: ChatMessage = {
  //           id: chatId,
  //           speaker: name,
  //           message: text,
  //           timestamp: time,
  //         };

  //         this.chatMessages.push(newChatMessage);
  //         this.emit("chat_message_added", newChatMessage);
  //       }
  //     } catch (error) {
  //       ErrorHandler.log(
  //         error as Error,
  //         "Processing individual chat message element",
  //         true
  //       );
  //     }
  //   });
  // };
}
