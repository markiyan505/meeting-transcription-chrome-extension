import { useEffect } from "react";
import { useCaptionStore } from "@/store/captionStore";
import type { ChromeMessage, GetAppStateQuery } from "@/types/messages";

async function getTabId(): Promise<number> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab.id!;
}

export const useSyncCaptionStore = () => {
  const { _syncState } = useCaptionStore();

  useEffect(() => {
    let isMounted = true;

    const initializeState = async () => {
      try {
        console.log("[SYNC-HOOK] Initializing state...");
        const myTabId = await getTabId();
        const query: GetAppStateQuery = {
          type: "QUERY.APP.GET_STATE",
          payload: { tabId: myTabId },
        };

        const initialState = await chrome.runtime.sendMessage(query);
        if (isMounted && initialState) {
          console.log(
            "[SYNC-HOOK] Initializing state: Received initial state:",
            initialState
          );
          _syncState(initialState);
        }
      } catch (error) {
        console.warn(
          "[SYNC-HOOK] Initializing state: Could not fetch initial state from background.",
          error
        );
      }
    };

    const handleRuntimeMessage = (message: ChromeMessage) => {
      if (message.type === "EVENT.STATE_CHANGED") {
        console.log(
          "[SYNC-HOOK] Syncing state from background:",
          message.payload.newState
        );
        _syncState(message.payload.newState);
      }
    };

    initializeState();
    chrome.runtime.onMessage.addListener(handleRuntimeMessage);

    return () => {
      isMounted = false;
      chrome.runtime.onMessage.removeListener(handleRuntimeMessage);
    };
  }, [_syncState]);
};
