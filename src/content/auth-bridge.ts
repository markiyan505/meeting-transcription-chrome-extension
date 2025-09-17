console.log("Auth Bridge content script loaded.");

const SUPABASE_SESSION_KEY = /sb-.*-auth-token/;

const sendSessionToBackground = () => {
  let sessionData = null;
  let sessionKey = null;

  for (const key of Object.keys(localStorage)) {
    if (SUPABASE_SESSION_KEY.test(key)) {
      sessionData = localStorage.getItem(key);
      sessionKey = key;
      break;
    }
  }

  if (sessionData) {
    try {
      const parsedSession = JSON.parse(sessionData);

      chrome.runtime.sendMessage({
        type: "COMMAND.AUTH.UPDATE_SESSION",
        payload: {
          session: parsedSession,
          key: sessionKey,
          timestamp: Date.now(),
        },
      });

      console.log("Auth Bridge: Sent Supabase session to background.", {
        key: sessionKey,
        hasAccessToken: !!parsedSession.access_token,
        hasRefreshToken: !!parsedSession.refresh_token,
        expiresAt: parsedSession.expires_at,
      });
    } catch (e) {
      console.error("Auth Bridge: Failed to parse or send session.", e);
    }
  } else {
    chrome.runtime.sendMessage({
      type: "COMMAND.AUTH.CLEAR_SESSION",
      payload: { timestamp: Date.now() },
    });

    console.log("Auth Bridge: No Supabase session found, cleared auth state.");
  }
};

const validateSession = (session: any): boolean => {
  if (!session || !session.access_token || !session.expires_at) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  return session.expires_at > now;
};

sendSessionToBackground();

window.addEventListener("storage", (event) => {
  if (event.key && SUPABASE_SESSION_KEY.test(event.key)) {
    console.log(
      "Auth Bridge: Detected Supabase session change, re-sending session."
    );
    sendSessionToBackground();
  }
});

window.addEventListener("storage", (event) => {
  if (
    event.storageArea === sessionStorage &&
    event.key &&
    SUPABASE_SESSION_KEY.test(event.key)
  ) {
    console.log(
      "Auth Bridge: Detected Supabase session change in sessionStorage, re-sending session."
    );
    sendSessionToBackground();
  }
});

setInterval(() => {
  sendSessionToBackground();
}, 30000);
