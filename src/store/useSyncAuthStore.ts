import { useEffect } from "react";
import { useAuthStore } from "./AuthStore";

export const useSyncAuthStore = () => {
  const { _setSession, clearSession } = useAuthStore();

  useEffect(() => {
    const handleMessage = (message: any) => {
      console.log("[AUTH-SYNC] Received message:", message.type);

      if (message.type === "AUTH_STATE_UPDATED") {
        _setSession(message.session);
      } else if (message.type === "AUTH_SESSION_CLEARED") {
        clearSession();
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [_setSession, clearSession]);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log("[AUTH-SYNC] Checking auth status...");
        const response = await chrome.runtime.sendMessage({
          type: "GET_AUTH_STATUS",
        });

        if (response?.success) {
          console.log("[AUTH-SYNC] Auth status received:", {
            isAuthenticated: response.isAuthenticated,
            hasSession: !!response.session,
            tokenExpiry: response.tokenExpiry,
          });

          _setSession(response.session);
        } else {
          console.warn("[AUTH-SYNC] Failed to get auth status:", response);
        }
      } catch (error) {
        console.error("[AUTH-SYNC] Error getting auth status:", error);
      }
    };

    checkAuthStatus();
  }, [_setSession]);
};
