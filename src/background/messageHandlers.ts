/**
 * Type-safe message handler definitions
 * This file provides better type safety for message handling
 */

import type { ChromeMessage } from "@/types/messages";
import { AuthManager } from "./modules/AuthManager";
import { SettingsManager } from "./modules/SettingsManager";
import { stateService } from "./background";

// Helper type to extract message type from ChromeMessage union
export type MessageType = ChromeMessage["type"];

// Helper type to get the specific message type from the union
export type MessageByType<T extends MessageType> = Extract<
  ChromeMessage,
  { type: T }
>;

// Generic message handler type
export type MessageHandler<T extends MessageType = MessageType> = (
  message: MessageByType<T>,
  tabId: number,
  sendResponse: (response?: any) => void
) => Promise<void> | void;

// Handler map type
export type MessageHandlerMap = {
  [K in MessageType]?: MessageHandler<K>;
};

// Helper function to create type-safe handlers
export function createMessageHandler<T extends MessageType>(
  handler: MessageHandler<T>
): MessageHandler<T> {
  return handler;
}

// Helper function to safely call handlers
export async function callMessageHandler(
  message: ChromeMessage,
  handlers: MessageHandlerMap,
  tabId: number,
  sendResponse: (response?: any) => void
): Promise<boolean> {

  const handler = handlers[message.type];
  if (handler) {

    const isQuery = message.type.startsWith("QUERY.");
    await (handler as any)(message, tabId, sendResponse);
    return isQuery;

  } else {
    console.warn(
      `[MESSAGE_HANDLER] No handler found for message type: "${message.type}"`
    );
    return false;
  }
}

export const requiresAuth =
  <T extends ChromeMessage["type"]>(
    handler: MessageHandler<T>
  ): MessageHandler<T> =>
  async (message, tabId, sendResponse) => {
    // if (!(await AuthManager.isAuthenticated())) {
    //   console.warn(
    //     `[AUTH] Access denied for "${message.type}". User not authenticated.`
    //   );
    //   stateService.reportStateFromContent(tabId, { error: "not_authorized" });
    //   return;
    // }
    return handler(message, tabId, sendResponse);
  };

export const requiresActiveExtension =
  <T extends ChromeMessage["type"]>(
    handler: MessageHandler<T>
  ): MessageHandler<T> =>
  async (message, tabId, sendResponse) => {
    const settings = await SettingsManager.getSettings();
    if (!settings.isExtensionEnabled) {
      console.warn(
        `[SETTINGS] Action denied for "${message.type}". Extension is disabled.`
      );
      return;
    }
    return handler(message, tabId, sendResponse);
  };
