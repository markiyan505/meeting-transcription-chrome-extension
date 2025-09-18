// Auth Bridge - Isolated scope to prevent variable conflicts
(function () {
  "use strict";

  console.log("Auth Bridge content script loaded.");

  const SUPABASE_SESSION_KEY = /sb-.*-auth-token/;

  let lastSessionHash: string | null = null;
  let sessionUpdateTimeout: NodeJS.Timeout | null = null;
  let isUpdating = false;

  const sendSessionToBackground = () => {
    if (isUpdating) {
      console.log("Auth Bridge: Update already in progress, skipping");
      return;
    }

    isUpdating = true;

    if (sessionUpdateTimeout) {
      clearTimeout(sessionUpdateTimeout);
    }

    sessionUpdateTimeout = setTimeout(() => {
      try {
        let authSessionData = null;
        let authSessionKey = null;

        for (const key of Object.keys(localStorage)) {
          if (SUPABASE_SESSION_KEY.test(key)) {
            authSessionData = localStorage.getItem(key);
            authSessionKey = key;
            break;
          }
        }

        if (authSessionData) {
          try {
            const parsedSession = JSON.parse(authSessionData);

            const sessionHash = JSON.stringify({
              access_token: parsedSession.access_token,
              refresh_token: parsedSession.refresh_token,
              expires_at: parsedSession.expires_at,
              user_id: parsedSession.user?.id,
            });

            if (sessionHash !== lastSessionHash) {
              lastSessionHash = sessionHash;

              chrome.runtime.sendMessage({
                type: "COMMAND.AUTH.UPDATE_SESSION",
                payload: {
                  session: parsedSession,
                  key: authSessionKey,
                  timestamp: Date.now(),
                },
              });

              console.log("Auth Bridge: Session changed, sent to background.", {
                key: authSessionKey,
                hasAccessToken: !!parsedSession.access_token,
                hasRefreshToken: !!parsedSession.refresh_token,
                expiresAt: parsedSession.expires_at,
                userEmail: parsedSession.user?.email,
                userId: parsedSession.user?.id,
              });
            } else {
              console.log("Auth Bridge: Session unchanged, skipping update");
            }
          } catch (e) {
            console.error("Auth Bridge: Failed to parse session.", e);
          }
        } else {
          // Очищаємо хеш якщо сесії немає
          if (lastSessionHash !== null) {
            lastSessionHash = null;
            chrome.runtime.sendMessage({
              type: "COMMAND.AUTH.CLEAR_SESSION",
              payload: { timestamp: Date.now() },
            });
            console.log("Auth Bridge: No session found, cleared auth state.");
          }
        }
      } finally {
        isUpdating = false;
      }
    }, 2000);
  };

  const validateSession = (session: any): boolean => {
    if (!session || !session.access_token || !session.expires_at) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    return session.expires_at > now;
  };

  const debouncedSendSession = () => {
    if (sessionUpdateTimeout) {
      clearTimeout(sessionUpdateTimeout);
    }
    sessionUpdateTimeout = setTimeout(sendSessionToBackground, 1000);
  };

  sendSessionToBackground();

  window.addEventListener("storage", (event) => {
    if (event.key && SUPABASE_SESSION_KEY.test(event.key)) {
      console.log(
        "Auth Bridge: Detected localStorage change, scheduling update"
      );
      debouncedSendSession();
    }
  });

  window.addEventListener("storage", (event) => {
    if (
      event.storageArea === sessionStorage &&
      event.key &&
      SUPABASE_SESSION_KEY.test(event.key)
    ) {
      console.log(
        "Auth Bridge: Detected sessionStorage change, scheduling update"
      );
      debouncedSendSession();
    }
  });

  setInterval(() => {
    console.log("Auth Bridge: Periodic session check");
    sendSessionToBackground();
  }, 300000);

  window.addEventListener("focus", () => {
    console.log("Auth Bridge: Window focused, checking session");
    debouncedSendSession();
  });
})();
