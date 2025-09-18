import { useEffect } from "react";
import { useAuthStore } from "./AuthStore";

export const useSyncAuthStore = () => {
  const { _setSession, clearSession } = useAuthStore();

  useEffect(() => {
    const handleMessage = (message: any) => {
      console.log("[AUTH-SYNC] Received message:", {
        type: message.type,
        hasSession: !!message.session,
        hasPayload: !!message.payload,
      });

      if (message.type === "EVENT.AUTH_STATE_CHANGED") {
        console.log("[AUTH-SYNC] Auth state changed:", {
          hasSession: !!message.session,
          userId: message.session?.user?.id,
          email: message.session?.user?.email,
        });
        _setSession(message.session);
      } else if (message.type === "COMMAND.AUTH.CLEAR_SESSION") {
        console.log("[AUTH-SYNC] Clear session command received");
        clearSession();
      } else {
        console.log("[AUTH-SYNC] Unhandled message type:", message.type);
      }
    };

    console.log("[AUTH-SYNC] Setting up message listener");
    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      console.log("[AUTH-SYNC] Removing message listener");
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [_setSession, clearSession]);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log("[AUTH-SYNC] Checking auth status...");
        const startTime = Date.now();

        const response = await chrome.runtime.sendMessage({
          type: "QUERY.AUTH.GET_STATUS",
        });

        const duration = Date.now() - startTime;
        console.log(
          `[AUTH-SYNC] Auth status request completed in ${duration}ms`
        );

        if (response?.success) {
          console.log("[AUTH-SYNC] Auth status received:", {
            isAuthenticated: response.isAuthenticated,
            hasSession: !!response.session,
            hasUser: !!response.user,
            tokenExpiry: response.tokenExpiry,
            userId: response.user?.id,
            userEmail: response.user?.email,
          });

          _setSession(response.session);
          console.log("[AUTH-SYNC] Session updated in store");
        } else {
          console.warn("[AUTH-SYNC] Failed to get auth status:", {
            success: response?.success,
            error: response?.error,
            response,
          });
          _setSession(null);
        }
      } catch (error) {
        console.error("[AUTH-SYNC] Error getting auth status:", error);
        _setSession(null);
      }
    };

    console.log("[AUTH-SYNC] Initializing auth sync...");
    checkAuthStatus();
  }, [_setSession]);
};
