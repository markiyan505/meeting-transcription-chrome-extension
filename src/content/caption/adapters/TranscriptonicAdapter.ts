/**
 * Адаптер для transcriptonic (Google Meet)
 * Успадковується від BaseAdapter і реалізує логіку, специфічну для Google Meet.
 */

import {
  OperationResult,
  GoogleMeetConfig,
  CaptionEntry,
  ChatMessage,
} from "../types";
import { BaseAdapter } from "./BaseAdapter";
import {
  selectElements,
  waitForElement,
  ErrorHandler,
} from "../utils/originalUtils";

export class TranscriptonicAdapter extends BaseAdapter {
  private userName: string = "You";
  protected config: GoogleMeetConfig;
  private selectors: any;
  private observers: { [key: string]: MutationObserver } = {};

  private personNameBuffer = "";
  private transcriptTextBuffer = "";
  private timestampBuffer = "";

  private captionIdBuffer: string = "";

  private isTranscriptDomErrorCaptured = false;
  private isChatMessagesDomErrorCaptured = false;
  private hasMeetingEnded = false;

  constructor(config: GoogleMeetConfig) {
    super(config);
    this.config = config;
    const uiType = this.detectUIType();
    this.selectors = {
      ...config.baseSelectors,
      ...config.uiVersions[uiType],
    };
  }

  async initialize(): Promise<OperationResult> {
    if (!window.location.hostname.includes("meet.google.com")) {
      return { success: false, error: "Not on a Google Meet page" };
    }
    this.setupMeetingStateObserver();
    this.initializeUserName();
    await this.updateMeetingInfo();
    // await this.setupMeetingEndListener();

    await this.checkMeetingStart();

    this.emit("initialized", { platform: "google-meet" });

    this.checkMeetingEnd();

    await this.updateMeetingTitle();
    this.emit("meeting_info_changed", this.getMeetingInfo());

    return {
      success: true,
      message: "TranscriptonicAdapter initialized successfully",
    };
  }

  protected meetingTitle: string = document.title;
  private async updateMeetingTitle(): Promise<void> {
    try {
      await waitForElement(".u6vdEc");

      await new Promise((resolve) => setTimeout(resolve, 500));

      const meetingTitleElement = document.querySelector(".u6vdEc");
      if (meetingTitleElement?.textContent) {
        this.meetingTitle = meetingTitleElement.textContent;
        console.log(
          "[TranscriptonicAdapter] Meeting title updated:",
          this.meetingTitle
        );
      } else {
        console.warn("Meeting title element not found in DOM");
      }
    } catch (err) {
      console.error(
        "[TranscriptonicAdapter] Failed to update meeting title:",
        err
      );
      this.meetingTitle = document.title;
    }
  }

  protected transcriptObserver: MutationObserver | null = null;
  protected transcriptMutationCallback: (
    mutationsList: MutationRecord[],
    observer: MutationObserver
  ) => void = () => {};
  protected mutationConfig: MutationObserverInit = {
    childList: true,
    attributes: true,
    subtree: true,
    characterData: true,
  };

  protected setupCaptionObserver(): void {
    waitForElement(
      this.selectors.captionsButton,
      this.selectors.captionsButtonText
    ).then(() => {
      const captionsButton = selectElements(
        this.selectors.captionsButton,
        this.selectors.captionsButtonText
      )[0];

      captionsButton.click();

      waitForElement(this.selectors.captionsContainer)
        .then(() => {
          let transcriptTargetNode = document.querySelector(
            this.selectors.captionsContainer
          );
          // For old captions UI
          // if (!transcriptTargetNode) {
          //   transcriptTargetNode = document.querySelector(".a4cQT")
          //   canUseAriaBasedTranscriptSelector = false
          // }

          if (transcriptTargetNode) {
            this.transcriptObserver = new MutationObserver(
              this.transcriptMutationCallback
            );
            this.transcriptObserver.observe(
              transcriptTargetNode,
              this.mutationConfig
            );
          } else {
            throw new Error("Transcript element not found in DOM");
          }
        })
        .catch((err) => {
          console.error(err);
          this.isTranscriptDomErrorCaptured = true;
        });
    });
  }

  protected chatMessagesObserver: MutationObserver | null = null;
  protected chatMessagesMutationCallback: (
    mutationsList: MutationRecord[],
    observer: MutationObserver
  ) => void = () => {};

  protected setupChatObserver(): void {
    waitForElement(".google-symbols", "chat")
      .then(() => {
        const chatMessagesButton = selectElements(".google-symbols", "chat")[0];

        chatMessagesButton.click();

        waitForElement(`div[aria-live="polite"].Ge9Kpc`).then(() => {
          chatMessagesButton.click();
          try {
            const chatMessagesTargetNode = document.querySelector(
              `div[aria-live="polite"].Ge9Kpc`
            );

            if (chatMessagesTargetNode) {
              this.chatMessagesObserver = new MutationObserver(
                this.chatMessagesMutationCallback
              );
              this.chatMessagesObserver.observe(
                chatMessagesTargetNode,
                this.mutationConfig
              );
            } else {
              throw new Error("Chat messages element not found in DOM");
            }
          } catch (err) {
            console.error(err);
            this.isChatMessagesDomErrorCaptured = true;
          }
        });
      })
      .catch((err) => {
        console.error(err);
        this.isChatMessagesDomErrorCaptured = true;
      });
  }

  protected attendeesObserver: MutationObserver | null = null;
  protected attendeesMutationCallback: (
    mutationsList: MutationRecord[],
    observer: MutationObserver
  ) => void = () => {};

  protected setupAttendeeObserver(): void {}

  protected meetingStartObserver: MutationObserver | null = null;
  protected meetingStartMutationCallback: (
    mutationsList: MutationRecord[],
    observer: MutationObserver
  ) => void = () => {};

  private meetingState: boolean = false;

  protected async checkMeetingStart(): Promise<void> {
    try {
      await waitForElement(
        this.selectors.leaveButton,
        this.selectors.leaveButtonText
      );
      this.meetingState = true;
      console.log("[TranscriptonicAdapter] Meeting started detected");
    } catch (err) {
      console.error("[TranscriptonicAdapter] Meeting start check failed:", err);
      this.meetingState = false;
      throw err;
    }
  }
  protected checkMeetingEnd(): void {
    try {
      selectElements(
        this.selectors.leaveButton,
        this.selectors.leaveButtonText
      )[0].parentElement.parentElement.addEventListener("click", () => {
        this.hasMeetingEnded = true;
        this.isInitialized = false;
        if (this.transcriptObserver) {
          this.transcriptObserver.disconnect();
        }
        if (this.chatMessagesObserver) {
          this.chatMessagesObserver.disconnect();
        }
        if (this.attendeesObserver) {
          this.attendeesObserver.disconnect();
        }
      });
    } catch (err) {
      console.error(err);
    }
  }

  private async initializeUserName(): Promise<void> {
    try {
      const userNameElement = document.querySelector(
        this.config.baseSelectors.userName
      );
      if (userNameElement?.textContent) {
        this.userName = userNameElement.textContent;
      }
    } catch (error) {
      console.warn("Could not capture user name, defaulting to 'You'.", error);
    }
  }

  async isCaptionsEnabled(): Promise<boolean> {
    return document.querySelector(this.selectors.captionsContainer) !== null;
  }

  async isInMeeting(): Promise<boolean> {
    const isFound = !!Array.from(
      document.querySelectorAll(this.selectors.leaveButton)
    ).find((element) => element.textContent === this.selectors.leaveButtonText);

    return isFound;
  }

  // async isInMeeting(): Promise<boolean> {
  //   const leaveButton = this.selectElementByText(
  //     this.selectors.leaveButton,
  //     this.selectors.leaveButtonText
  //   );
  //   return leaveButton !== null;
  // }

  async enableCaptions(): Promise<OperationResult> {
    const button = selectElements(
      this.selectors.captionsButton,
      this.selectors.captionsButtonText
    )[0] as HTMLElement;
    if (!button) return { success: false, error: "Captions button not found" };
    button.click();
    this.emit("captions_enabled", { timestamp: new Date().toISOString() });
    return { success: true };
  }

  async disableCaptions(): Promise<OperationResult> {
    return this.enableCaptions();
  }

  async cleanup(): Promise<OperationResult> {
    this.cleanupPlatformObservers();
    this.eventListeners.clear();
    this.isInitialized = false;
    return { success: true, message: "Cleanup completed successfully" };
  }

  async startRecording(): Promise<OperationResult> {
    if (this.isRecording) {
      return { success: true, message: "Recording already started" };
    }

    console.log("[TranscriptonicAdapter] Starting recording");
    await this.updateMeetingTitle();
    this.emit("meeting_info_changed", this.getMeetingInfo());

    console.log("\n\n");
    return super.startRecording();
  }

  async stopRecording(): Promise<OperationResult> {
    // this.pushBufferToCaptions();
    return super.stopRecording();
  }

  async pauseRecording(): Promise<OperationResult> {
    // this.pushBufferToCaptions();
    return super.pauseRecording();
  }

  protected async setupPlatformObservers(): Promise<void> {
    try {
      const captionsContainer = await waitForElement(
        this.selectors.captionsContainer
      );

      const debouncedProcessCaptionUpdates = this.debounce(
        this.processCaptionUpdates.bind(this),
        200
      );

      const captionsObserver = new MutationObserver(
        this.safeWrap(debouncedProcessCaptionUpdates, "meet_captions")
      );
      captionsObserver.observe(captionsContainer, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      this.observers.captions = captionsObserver;
      await this.setupChatListener();
    } catch (error) {
      if (!this.isTranscriptDomErrorCaptured && !this.hasMeetingEnded) {
        console.error("Critical error: Could not set up observers.", "error");
        this.isTranscriptDomErrorCaptured = true;
      }
    }
  }

  private async setupChatListener(): Promise<void> {
    try {
      await waitForElement(this.selectors.chatButton);
      const chatButton = document.querySelector(
        this.selectors.chatButton
      ) as HTMLElement;
      if (!chatButton) throw new Error("Chat button not found");

      chatButton.click();
      const chatContainer = await waitForElement(this.selectors.chatContainer);
      chatButton.click();

      const debouncedProcessChatUpdates = this.debounce(
        this.processChatUpdates.bind(this),
        500
      );

      const chatObserver = new MutationObserver(
        this.safeWrap(debouncedProcessChatUpdates, "meet_chat")
      );
      chatObserver.observe(chatContainer, { childList: true, subtree: true });
      this.observers.chat = chatObserver;
    } catch (error) {
      if (!this.isChatMessagesDomErrorCaptured && !this.hasMeetingEnded) {
        console.error("Could not initialize chat capture.", "error");
        this.isChatMessagesDomErrorCaptured = true;
      }
    }
  }

  // private async setupMeetingEndListener(): Promise<void> {
  //   const leaveButton = (await waitForElement(
  //     this.selectors.leaveButton
  //   )) as HTMLElement;
  //   leaveButton.addEventListener("click", () => {
  //     this.emit("meeting_ended", { timestamp: new Date().toISOString() });
  //   });
  // }

  // protected setupPlatformObservers(): void {
  //   this.setupCaptionObserver();
  //   this.setupChatObserver();
  // }

  protected cleanupPlatformObservers(): void {
    Object.values(this.observers).forEach((observer) => observer.disconnect());
    this.observers = {};
  }

  private detectUIType(): 1 | 2 {
    return document.querySelector(".google-symbols") !== null ? 2 : 1;
  }

  private async updateMeetingInfo(): Promise<void> {
    this.meetingInfo.title =
      document.querySelector(this.selectors.meetingTitle)?.textContent ||
      document.title;
  }

  // private setupCaptionObserver(): void {
  //   const container = document.querySelector(this.selectors.captionsContainer);
  //   if (!container) {
  //     console.warn("Captions container not found. Observer not set.");
  //     return;
  //   }
  //   const observer = new MutationObserver(() => {
  //     if (!this.isPaused) this.processCaptionUpdates();
  //   });
  //   observer.observe(container, {
  //     childList: true,
  //     subtree: true,
  //     characterData: true,
  //   });
  //   this.observers.captionObserver = observer;
  // }

  // private setupChatObserver(): void {
  //   const container = document.querySelector(this.selectors.chatContainer);
  //   if (!container) return;
  //   const observer = new MutationObserver(() => {
  //     if (!this.isPaused) this.processChatUpdates();
  //   });
  //   observer.observe(container, { childList: true, subtree: true });
  //   this.observers.chatObserver = observer;
  // }

  private processCaptionUpdates(): void {
    try {
      const container = document.querySelector(
        this.selectors.captionsContainer
      );

      if (!container || container.children.length <= 1) {
        // this.pushBufferToCaptions();
        return;
      }

      const lastPersonNode = container.children[container.children.length - 2];
      const speaker =
        lastPersonNode.childNodes[0]?.textContent?.trim() || "Unknown";
      const text = lastPersonNode.childNodes[1]?.textContent?.trim() || "";

      if (!text) {
        // this.pushBufferToCaptions();
        return;
      }

      if (this.transcriptTextBuffer === "") {
        console.log("[TranscriptonicAdapter] Caption buffer is empty");
        this.personNameBuffer = speaker;
        this.timestampBuffer = new Date().toISOString();
        this.transcriptTextBuffer = text;
      } else if (this.personNameBuffer !== speaker) {
        console.log(
          "[TranscriptonicAdapter] Person name buffer is not equal to speaker"
        );
        // this.pushBufferToCaptions();

        this.personNameBuffer = speaker;
        this.timestampBuffer = new Date().toISOString();
        this.transcriptTextBuffer = text;
        this.captionIdBuffer = `caption_${Date.now()}_${Math.random()}`;
        console.log(
          "[TranscriptonicAdapter] Caption ID buffer:",
          this.captionIdBuffer
        );

        this.emit("caption_added", {
          id: this.captionIdBuffer,
          speaker:
            this.personNameBuffer === "You"
              ? this.userName
              : this.personNameBuffer,
          text: this.transcriptTextBuffer,
          timestamp: this.timestampBuffer,
        });
      } else {
        console.log(
          "[TranscriptonicAdapter] Person name buffer is equal to speaker"
        );
        // if (text.length - this.transcriptTextBuffer.length < -250) {
        //   this.pushBufferToCaptions();
        //   this.timestampBuffer = new Date().toISOString();
        // }

        this.transcriptTextBuffer = text;
        if (this.captionIdBuffer === "") {
          this.captionIdBuffer = `caption_${Date.now()}_${Math.random()}`;
        }
        this.emit("caption_updated", {
          id: this.captionIdBuffer,
          speaker:
            this.personNameBuffer === "You"
              ? this.userName
              : this.personNameBuffer,
          text: this.transcriptTextBuffer,
          timestamp: this.timestampBuffer,
        });
        console.log(
          "[TranscriptonicAdapter] Caption updated:",
          this.captionIdBuffer,
          this.personNameBuffer,
          this.transcriptTextBuffer,
          this.timestampBuffer
        );
      }
    } catch (error) {
      this.emit("error", {
        context: "caption_processing",
        error: error instanceof Error ? error.message : String(error),
      });
      console.error("Error processing caption updates for Google Meet:", error);
    }
  }

  private processChatUpdates(): void {
    const chatContainer = document.querySelector(this.selectors.chatContainer);
    if (!chatContainer || chatContainer.children.length === 0) return;

    const lastMessage = chatContainer.lastChild as HTMLElement;
    if (!lastMessage) return;

    const speakerElement = lastMessage.querySelector("[data-sender-name]");
    const messageElement = lastMessage.querySelector("[data-message-text]");

    if (speakerElement && messageElement) {
      const speaker = speakerElement.textContent?.trim() || "Unknown";
      const message = messageElement.textContent?.trim() || "";

      if (message) {
        const isDuplicate = this.chatMessages.some(
          (cm) =>
            cm.speaker === speaker &&
            message.includes(cm.message) &&
            new Date().getTime() - new Date(cm.timestamp).getTime() < 5000
        );

        if (!isDuplicate) {
          const chatMessage: ChatMessage = {
            id: `chat_${Date.now()}_${Math.random()}`,
            speaker,
            message,
            timestamp: new Date().toISOString(),
          };
          this.chatMessages.push(chatMessage);
          this.emit("chat_message_added", chatMessage);
        }
      }
    }
  }

  private pushBufferToCaptions(): void {
    if (this.personNameBuffer && this.transcriptTextBuffer) {
      const speaker =
        this.personNameBuffer === "You" ? this.userName : this.personNameBuffer;
      const newCaption: CaptionEntry = {
        id: `caption_${Date.now()}_${Math.random()}`,
        speaker: speaker,
        text: this.transcriptTextBuffer,
        timestamp: this.timestampBuffer,
      };
      this.captions.push(newCaption);
      this.emit("caption_added", newCaption);
    }
    this.personNameBuffer = "";
    this.transcriptTextBuffer = "";
    this.timestampBuffer = "";
  }
}
