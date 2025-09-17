import { useEffect } from "react";
import { useAuthStore } from "./AuthStore";

export const useSyncAuthStore = () => {
  const { _setSession, clearSession } = useAuthStore();

  useEffect(() => {
    const handleMessage = (message: any) => {
      console.log("[AUTH-SYNC] Received message:", message.type);

      if (message.type === "EVENT.AUTH_STATE_CHANGED") {
        _setSession(message.session);
      } else if (message.type === "COMMAND.AUTH.CLEAR_SESSION") {
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
          type: "QUERY.AUTH.GET_STATUS",
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
