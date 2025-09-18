import { createClient, Session } from "@supabase/supabase-js";
import {
  getSupabaseConfig,
  validateSupabaseConfig,
} from "../../config/supabase";

const config = getSupabaseConfig();
validateSupabaseConfig();

import { REFRESH_TOKEN_ALARM_NAME } from "../background";

const supabase = createClient(config.url, config.anonKey);
const AUTH_STORAGE_KEY = config.storage.sessionKey;

export class AuthManager {
  static async saveSession(
    session: Session,
    scheduleRefresh: boolean = true
  ): Promise<void> {
    console.log("[AuthManager] Saving session:", {
      userId: session.user?.id,
      email: session.user?.email,
      expiresAt: session.expires_at
        ? new Date(session.expires_at * 1000).toISOString()
        : null,
      expiresIn: session.expires_in,
      hasRefreshToken: !!session.refresh_token,
      scheduleRefresh,
    });

    await chrome.storage.local.set({ [AUTH_STORAGE_KEY]: session });
    console.log("[AuthManager] Session saved successfully");

    // Оновлюємо UI про зміну стану авторизації
    await this.notifyUIStateChange(session);

    if (scheduleRefresh) {
      this.scheduleTokenRefresh(session.expires_in);
    }
  }

  static async getSession(): Promise<Session | null> {
    console.log("[AuthManager] Getting session from storage...");
    const result = await chrome.storage.local.get(AUTH_STORAGE_KEY);
    const session = result[AUTH_STORAGE_KEY] || null;

    if (session) {
      console.log("[AuthManager] Session found:", {
        userId: session.user?.id,
        email: session.user?.email,
        expiresAt: session.expires_at
          ? new Date(session.expires_at * 1000).toISOString()
          : null,
        hasRefreshToken: !!session.refresh_token,
        isExpired: session.expires_at
          ? session.expires_at <= Math.floor(Date.now() / 1000)
          : true,
      });
    } else {
      console.log("[AuthManager] No session found in storage");
    }

    return session;
  }

  static async clearSession(): Promise<void> {
    console.log("[AuthManager] Clearing session and alarms...");
    await chrome.storage.local.remove(AUTH_STORAGE_KEY);
    await chrome.alarms.clear(REFRESH_TOKEN_ALARM_NAME);
    console.log("[AuthManager] Session and alarms cleared successfully");

    // Оновлюємо UI про зміну стану авторизації
    await this.notifyUIStateChange(null);
  }

  static async refreshToken(): Promise<void> {
    console.log("[AuthManager] Starting token refresh process...");
    const currentSession = await this.getSession();

    if (!currentSession?.refresh_token) {
      console.warn(
        "[AuthManager] No refresh token available. Clearing session."
      );
      await this.clearSession();
      return;
    }

    console.log("[AuthManager] Attempting to refresh token with Supabase...", {
      hasRefreshToken: !!currentSession.refresh_token,
      currentExpiresAt: currentSession.expires_at
        ? new Date(currentSession.expires_at * 1000).toISOString()
        : null,
    });

    try {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: currentSession.refresh_token,
      });

      if (error) {
        console.error("[AuthManager] Token refresh failed with error:", {
          error: error.message,
          status: error.status,
          details: error,
        });
        console.log("[AuthManager] Clearing session due to refresh failure");
        await this.clearSession();
        return;
      }

      if (!data.session) {
        console.error(
          "[AuthManager] Token refresh failed: No session returned"
        );
        console.log("[AuthManager] Clearing session due to missing session");
        await this.clearSession();
        return;
      }

      console.log("[AuthManager] Token refreshed successfully:", {
        newExpiresAt: data.session.expires_at
          ? new Date(data.session.expires_at * 1000).toISOString()
          : null,
        newExpiresIn: data.session.expires_in,
        userId: data.session.user?.id,
      });

      await this.saveSession(data.session, false);
    } catch (error) {
      console.error(
        "[AuthManager] Unexpected error during token refresh:",
        error
      );
      console.log("[AuthManager] Clearing session due to unexpected error");
      await this.clearSession();
    }
  }

  private static scheduleTokenRefresh(expiresInSeconds: number): void {
    console.log("[AuthManager] Scheduling token refresh...", {
      expiresInSeconds,
      refreshBeforeExpiry: config.auth.refreshBeforeExpiry,
    });

    const refreshBeforeExpiry = config.auth.refreshBeforeExpiry;
    const refreshDelaySeconds = Math.max(
      60,
      expiresInSeconds - refreshBeforeExpiry
    );
    const refreshDelayMinutes = refreshDelaySeconds / 60;

    chrome.alarms.create(REFRESH_TOKEN_ALARM_NAME, {
      delayInMinutes: refreshDelayMinutes,
    });

    console.log("[AuthManager] Token refresh scheduled:", {
      delayInMinutes: refreshDelayMinutes.toFixed(2),
      alarmName: REFRESH_TOKEN_ALARM_NAME,
      scheduledFor: new Date(
        Date.now() + refreshDelayMinutes * 60 * 1000
      ).toISOString(),
    });
  }

  static async isAuthenticated(): Promise<boolean> {
    console.log("[AuthManager] Checking authentication status...");
    const session = await this.getSession();

    if (!session) {
      console.log("[AuthManager] No session found - not authenticated");
      return false;
    }

    if (!session.expires_at) {
      console.log(
        "[AuthManager] Session has no expiry date - not authenticated"
      );
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    const isAuthenticated = session.expires_at > now;

    console.log("[AuthManager] Authentication check result:", {
      isAuthenticated,
      expiresAt: new Date(session.expires_at * 1000).toISOString(),
      currentTime: new Date(now * 1000).toISOString(),
      timeUntilExpiry: session.expires_at - now,
      userId: session.user?.id,
    });

    return isAuthenticated;
  }

  static async getTokenExpiry(): Promise<Date | null> {
    console.log("[AuthManager] Getting token expiry...");
    const session = await this.getSession();

    if (!session || !session.expires_at) {
      console.log("[AuthManager] No session or expiry date found");
      return null;
    }

    const expiryDate = new Date(session.expires_at * 1000);
    console.log("[AuthManager] Token expiry:", {
      expiryDate: expiryDate.toISOString(),
      timeUntilExpiry: Math.floor(
        (session.expires_at - Date.now() / 1000) / 60
      ),
      isExpired: session.expires_at <= Math.floor(Date.now() / 1000),
    });

    return expiryDate;
  }

  static async getTokenExpiryInSeconds(): Promise<number> {
    console.log("[AuthManager] Getting token expiry in seconds...");
    const session = await this.getSession();

    if (!session || !session.expires_at) {
      console.log("[AuthManager] No session or expiry date - returning 0");
      return 0;
    }

    const now = Math.floor(Date.now() / 1000);
    const secondsUntilExpiry = Math.max(0, session.expires_at - now);

    console.log("[AuthManager] Token expiry in seconds:", {
      secondsUntilExpiry,
      minutesUntilExpiry: Math.floor(secondsUntilExpiry / 60),
      hoursUntilExpiry: Math.floor(secondsUntilExpiry / 3600),
    });

    return secondsUntilExpiry;
  }

  static async getUser(): Promise<any> {
    console.log("[AuthManager] Getting user information...");
    const session = await this.getSession();
    const user = session?.user || null;

    if (user) {
      console.log("[AuthManager] User found:", {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
      });
    } else {
      console.log("[AuthManager] No user found in session");
    }

    return user;
  }

  static async validateToken(): Promise<boolean> {
    console.log("[AuthManager] Validating token with Supabase...");
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("[AuthManager] Token validation failed with error:", {
          error: error.message,
          status: error.status,
          details: error,
        });
        return false;
      }

      if (!user) {
        console.log("[AuthManager] Token validation failed: No user returned");
        return false;
      }

      console.log("[AuthManager] Token validation successful:", {
        userId: user.id,
        email: user.email,
      });

      return true;
    } catch (error) {
      console.error(
        "[AuthManager] Token validation failed with exception:",
        error
      );
      return false;
    }
  }

  static async notifyUIStateChange(session: Session | null): Promise<void> {
    try {
      console.log("[AuthManager] Notifying UI about auth state change");

      chrome.runtime.sendMessage({
        type: "EVENT.AUTH.STATE_CHANGED",
        payload: {
          timestamp: Date.now(),
          hasSession: !!session,
          session: session,
        },
      });
    } catch (error) {
      console.error("[AuthManager] Error notifying UI:", error);
    }
  }
}

chrome.storage.onChanged.addListener((changes, namespace) => {
  console.log("[BACKGROUND] Storage changed:", { changes, namespace });
});
