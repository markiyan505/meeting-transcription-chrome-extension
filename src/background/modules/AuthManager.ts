import { createClient, Session } from "@supabase/supabase-js";
import {
  getSupabaseConfig,
  validateSupabaseConfig,
} from "../../config/supabase";

const config = getSupabaseConfig();
validateSupabaseConfig();

const supabase = createClient(config.url, config.anonKey);
const AUTH_STORAGE_KEY = config.storage.sessionKey;

export class AuthManager {
  static async saveSession(
    session: Session,
    scheduleRefresh: boolean = true
  ): Promise<void> {
    await chrome.storage.local.set({ [AUTH_STORAGE_KEY]: session });
    console.log("[AuthManager] Session saved.");
    if (scheduleRefresh) {
      this.scheduleTokenRefresh(session.expires_in);
    }
  }

  static async getSession(): Promise<Session | null> {
    const result = await chrome.storage.local.get(AUTH_STORAGE_KEY);
    return result[AUTH_STORAGE_KEY] || null;
  }

  static async clearSession(): Promise<void> {
    await chrome.storage.local.remove(AUTH_STORAGE_KEY);
    await chrome.alarms.clear("refreshTokenAlarm");
    console.log("[AuthManager] Session cleared.");
  }

  static async refreshToken(): Promise<void> {
    const currentSession = await this.getSession();
    if (!currentSession?.refresh_token) {
      console.log("[AuthManager] No refresh token. Clearing session.");
      await this.clearSession();
      return;
    }

    console.log("[AuthManager] Attempting to refresh token...");
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: currentSession.refresh_token,
    });

    if (error || !data.session) {
      console.error("[AuthManager] Token refresh failed. Logging out.", error);
      await this.clearSession();
    } else {
      console.log("[AuthManager] Token refreshed successfully.");
      await this.saveSession(data.session, false);
    }
  }

  private static scheduleTokenRefresh(expiresInSeconds: number): void {
    const refreshBeforeExpiry = config.auth.refreshBeforeExpiry;
    const refreshDelaySeconds = Math.max(
      60,
      expiresInSeconds - refreshBeforeExpiry
    );
    const refreshDelayMinutes = refreshDelaySeconds / 60;

    chrome.alarms.create("refreshTokenAlarm", {
      delayInMinutes: refreshDelayMinutes,
    });
    console.log(
      `[AuthManager] Token refresh scheduled in ${refreshDelayMinutes.toFixed(
        2
      )} mins.`
    );
  }

  static async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    if (!session || !session.expires_at) return false;

    const now = Math.floor(Date.now() / 1000);
    return session.expires_at > now;
  }

  static async getTokenExpiry(): Promise<Date | null> {
    const session = await this.getSession();
    if (!session || !session.expires_at) return null;

    return new Date(session.expires_at * 1000);
  }

  static async getTokenExpiryInSeconds(): Promise<number> {
    const session = await this.getSession();
    if (!session || !session.expires_at) return 0;

    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, session.expires_at - now);
  }

  static async getUser(): Promise<any> {
    const session = await this.getSession();
    return session?.user || null;
  }

  static async validateToken(): Promise<boolean> {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      return !error && !!user;
    } catch (error) {
      console.error("[AuthManager] Token validation failed:", error);
      return false;
    }
  }
}
