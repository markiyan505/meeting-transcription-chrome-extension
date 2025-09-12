console.log("Content script loaded successfully");

// Import modules
import { CONTROL_PANEL, SUBTITLES_PANEL } from "./types/types";
import { createFloatPanel } from "./panels/panelFactory";
import {
  setupRuntimeMessageHandler,
  setupWindowMessageHandler,
} from "./messaging/messaging";

// Import caption integration module
import {
  initializeCaptionModule,
  handleCaptionMessages,
  cleanupCaptionModule,
  triggerAutoSave,
} from "./captionIntegration";

// Setup message handlers
setupRuntimeMessageHandler();
setupWindowMessageHandler();

// Create panels using unified function
createFloatPanel(CONTROL_PANEL);
// createFloatPanel(SUBTITLES_PANEL);

// Налаштовуємо обробники подій
window.addEventListener("beforeunload", async (event) => {
  await triggerAutoSave();
  cleanupCaptionModule();
});

window.addEventListener("unload", cleanupCaptionModule);

// Налаштовуємо обробник повідомлень від розширення для субтитрів
chrome.runtime.onMessage.addListener(handleCaptionMessages);

// Додати обробник для повідомлень від UI
window.addEventListener("message", (event) => {
  // Перевіряємо, чи це повідомлення від нашого iframe
  if (event.data?.type === "CAPTION_ACTION") {
    console.log("🎮 [CONTENT SCRIPT] Received caption action from UI:", {
      action: event.data.action,
      messageId: event.data.messageId,
      data: event.data.data,
      timestamp: new Date().toISOString(),
    });

    // Перенаправляємо до модуля субтитрів
    handleCaptionMessages(
      { type: event.data.action, data: event.data.data },
      { tab: { id: 0 } } as chrome.runtime.MessageSender,
      (response: any) => {
        console.log("🎮 [CONTENT SCRIPT] Sending response to UI:", {
          messageId: event.data.messageId,
          success: response.success,
          hasData: !!response.data,
          hasError: !!response.error,
        });

        // Відправляємо відповідь назад до UI
        if (event.source && "postMessage" in event.source) {
          (event.source as Window).postMessage(
            {
              type: "CAPTION_RESPONSE",
              messageId: event.data.messageId,
              success: response.success,
              data: response.data,
              error: response.error,
            },
            { targetOrigin: "*" }
          );
        }
      }
    );
  }
});

// Ініціалізуємо модуль субтитрів після завантаження DOM
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeCaptionModule);
} else {
  initializeCaptionModule();
}
