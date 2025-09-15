import { useEffect, useRef } from "react";
import { useCaptionStore, CaptionState } from "@/store/captionStore";
import { MessageType } from "@/types/messages";

const CAPTION_STATE_STORAGE_KEY = "caption_session_state";

export const useSyncCaptionStore = () => {
  const { _syncState, isExtensionEnabled } = useCaptionStore();

  const syncStateRef = useRef(_syncState);
  syncStateRef.current = _syncState;

  const prevExtensionEnabledRef = useRef(isExtensionEnabled);

  useEffect(() => {
    let isMounted = true;

    const initializeState = async () => {
      try {
        const initialState: CaptionState = await chrome.runtime.sendMessage({
          type: MessageType.GET_CAPTION_STATUS,
        });

        if (isMounted && initialState) {
          syncStateRef.current(initialState);
        }
      } catch (error) {
        console.warn(
          "[SYNC-HOOK] Could not fetch initial state from background. It might not be ready yet.",
          error
        );

        try {
          const result = await chrome.storage.session.get(
            CAPTION_STATE_STORAGE_KEY
          );
          if (isMounted && result[CAPTION_STATE_STORAGE_KEY]) {
            syncStateRef.current(result[CAPTION_STATE_STORAGE_KEY]);
          }
        } catch (storageError) {
          console.error(
            "[SYNC-HOOK] Failed to sync state from storage as well:",
            storageError
          );
        }
      }
    };

    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: "sync" | "local" | "session" | "managed"
    ) => {
      if (areaName === "session" && changes[CAPTION_STATE_STORAGE_KEY]) {
        const newState = changes[CAPTION_STATE_STORAGE_KEY].newValue;
        if (newState) {
          syncStateRef.current(newState);
        }
      }
    };

    const handleRuntimeMessage = (message: any) => {
      if (message.type === MessageType.STATE_UPDATED && message.data) {
        syncStateRef.current(message.data);
      } else if (
        message.type === MessageType.TOGGLE_EXTENSION_STATE &&
        typeof message.isEnabled === "boolean"
      ) {
        syncStateRef.current({ isExtensionEnabled: message.isEnabled });
      }
    };

    initializeState();
    chrome.storage.onChanged.addListener(handleStorageChange);
    chrome.runtime.onMessage.addListener(handleRuntimeMessage);

    return () => {
      isMounted = false;
      chrome.storage.onChanged.removeListener(handleStorageChange);
      chrome.runtime.onMessage.removeListener(handleRuntimeMessage);
    };
  }, []);

  useEffect(() => {
    if (prevExtensionEnabledRef.current !== isExtensionEnabled) {
      prevExtensionEnabledRef.current = isExtensionEnabled;
    }
  }, [isExtensionEnabled]);
};
