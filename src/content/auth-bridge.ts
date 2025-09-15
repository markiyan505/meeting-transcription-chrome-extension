console.log("Auth Bridge content script loaded.");

const SUPABASE_SESSION_KEY = /sb-.*-auth-token/;

const sendSessionToBackground = () => {
  let sessionData = null;
  let sessionKey = null;

  // Шукаємо Supabase токен в localStorage
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

      // Відправляємо сесію в background script
      chrome.runtime.sendMessage({
        type: "AUTH_SESSION_FROM_PAGE",
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
    // Якщо токен не знайдено, відправляємо сигнал про вихід
    chrome.runtime.sendMessage({
      type: "AUTH_SESSION_CLEARED",
      payload: { timestamp: Date.now() },
    });

    console.log("Auth Bridge: No Supabase session found, cleared auth state.");
  }
};

// Функція для перевірки валідності токена
const validateSession = (session: any): boolean => {
  if (!session || !session.access_token || !session.expires_at) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  return session.expires_at > now;
};

// Відправляємо поточну сесію при завантаженні
sendSessionToBackground();

// Відстежуємо зміни в localStorage
window.addEventListener("storage", (event) => {
  if (event.key && SUPABASE_SESSION_KEY.test(event.key)) {
    console.log(
      "Auth Bridge: Detected Supabase session change, re-sending session."
    );
    sendSessionToBackground();
  }
});

// Відстежуємо зміни в sessionStorage (якщо токени зберігаються там)
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

// Періодична перевірка токенів (кожні 30 секунд)
setInterval(() => {
  sendSessionToBackground();
}, 30000);
