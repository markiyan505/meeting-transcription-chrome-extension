import { createClient } from "@supabase/supabase-js";
import { SUPABASE_CONFIG } from "@/config/supabase";

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

// Функція для створення авторизованого клієнта
const createAuthenticatedClient = (accessToken: string) => {
  return createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
};

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  avatar_url: string;
  created_at?: string;
  updated_at?: string;
}

export class DatabaseManager {
  private static readonly PROFILE_STORAGE_KEY = "user_profile";
  private static readonly CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 хвилин

  static async getUserProfile(): Promise<UserProfile | null> {
    console.log("[DatabaseManager] Getting user profile...");

    try {
      const cachedData = await this.getCachedData();
      if (cachedData && !this.isCacheExpired(cachedData)) {
        console.log("[DatabaseManager] Using cached profile");
        return cachedData.profile;
      }

      console.log(
        "[DatabaseManager] Cache miss or expired, fetching from database..."
      );
      const dbProfile = await this.fetchProfileFromDatabase();

      if (dbProfile) {
        await this.saveProfileToCache(dbProfile);
        console.log(
          "[DatabaseManager] Profile fetched and cached successfully"
        );
        return dbProfile;
      }

      console.log("[DatabaseManager] No profile found in database");
      return null;
    } catch (error) {
      console.error("[DatabaseManager] Error getting user profile:", error);

      const fallbackProfile = await this.getCachedProfile();
      if (fallbackProfile) {
        console.log("[DatabaseManager] Using cached profile as fallback");
        return fallbackProfile;
      }

      return null;
    }
  }

  static async getCachedData(): Promise<{
    profile: UserProfile;
    cachedAt: number;
  } | null> {
    try {
      const result = await chrome.storage.local.get(this.PROFILE_STORAGE_KEY);
      const cacheData = result[this.PROFILE_STORAGE_KEY];

      if (cacheData && cacheData.profile) {
        console.log("[DatabaseManager] Cached data found:", {
          id: cacheData.profile.id,
          email: cacheData.profile.email,
          cachedAt: cacheData.cachedAt,
        });
        return cacheData;
      }

      return null;
    } catch (error) {
      console.error("[DatabaseManager] Error getting cached data:", error);
      return null;
    }
  }

  static async getCachedProfile(): Promise<UserProfile | null> {
    const cachedData = await this.getCachedData();
    return cachedData?.profile || null;
  }

  private static async fetchProfileFromDatabase(): Promise<UserProfile | null> {
    try {
      // Отримуємо auth токен з chrome.storage
      const authToken = await this.getAuthToken();
      if (!authToken) {
        console.log("[DatabaseManager] No auth token found");
        return null;
      }

      console.log("[DatabaseManager] Using auth token:", {
        hasToken: !!authToken,
        tokenLength: authToken.length,
      });

      // Створюємо авторизований клієнт
      const authClient = createAuthenticatedClient(authToken);

      // Отримуємо поточного користувача
      const {
        data: { user },
        error: userError,
      } = await authClient.auth.getUser();

      if (userError) {
        console.error("[DatabaseManager] Auth error:", {
          error: userError.message,
          code: userError.code,
        });
        return null;
      }

      if (!user) {
        console.log("[DatabaseManager] No authenticated user found");
        return null;
      }

      console.log("[DatabaseManager] Authenticated user:", {
        id: user.id,
        email: user.email,
      });

      // Тепер отримуємо профіль користувача
      const { data, error } = await authClient
        .from("user_profile")
        .select(
          `
          id,
          first_name,
          last_name,
          email,
          role,
          avatar_url,
          created_at,
          updated_at
        `
        )
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("[DatabaseManager] Database error:", {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        return null;
      }

      if (!data) {
        console.log("[DatabaseManager] No profile found in database");
        return null;
      }

      console.log("[DatabaseManager] Profile fetched from database:", {
        id: data.id,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        name: `${data.first_name} ${data.last_name}`,
        role: data.role,
        avatar_url: data.avatar_url,
      });

      return data;
    } catch (error) {
      console.error(
        "[DatabaseManager] Unexpected error fetching profile:",
        error
      );
      return null;
    }
  }

  private static async getAuthToken(): Promise<string | null> {
    try {
      // Отримуємо сесію з chrome.storage
      const result = await chrome.storage.local.get(["auth_session"]);
      const session = result.auth_session;

      if (!session || !session.access_token) {
        console.log("[DatabaseManager] No session or access token found");
        return null;
      }

      return session.access_token;
    } catch (error) {
      console.error("[DatabaseManager] Error getting auth token:", error);
      return null;
    }
  }

  private static async saveProfileToCache(profile: UserProfile): Promise<void> {
    try {
      const cacheData = {
        profile,
        cachedAt: Date.now(),
      };

      await chrome.storage.local.set({
        [this.PROFILE_STORAGE_KEY]: cacheData,
      });

      console.log("[DatabaseManager] Profile cached successfully");
    } catch (error) {
      console.error("[DatabaseManager] Error caching profile:", error);
    }
  }

  private static isCacheExpired(cachedData: any): boolean {
    if (!cachedData.cachedAt) return true;

    const now = Date.now();
    const cacheAge = now - cachedData.cachedAt;

    return cacheAge > this.CACHE_EXPIRY_MS;
  }

  static async clearProfileCache(): Promise<void> {
    try {
      await chrome.storage.local.remove(this.PROFILE_STORAGE_KEY);
      console.log("[DatabaseManager] Profile cache cleared");
    } catch (error) {
      console.error("[DatabaseManager] Error clearing profile cache:", error);
    }
  }

  static async refreshProfile(): Promise<UserProfile | null> {
    console.log("[DatabaseManager] Force refreshing profile from database...");

    try {
      const dbProfile = await this.fetchProfileFromDatabase();

      if (dbProfile) {
        await this.saveProfileToCache(dbProfile);
        console.log("[DatabaseManager] Profile refreshed and cached");
        return dbProfile;
      }

      return null;
    } catch (error) {
      console.error("[DatabaseManager] Error refreshing profile:", error);
      return null;
    }
  }

  static async getCacheInfo(): Promise<{
    hasCache: boolean;
    cachedAt?: number;
    isExpired: boolean;
    ageMinutes?: number;
  }> {
    try {
      const result = await chrome.storage.local.get(this.PROFILE_STORAGE_KEY);
      const cacheData = result[this.PROFILE_STORAGE_KEY];

      if (!cacheData) {
        console.log("[DatabaseManager] No cache data found");
        return { hasCache: false, isExpired: true };
      }

      if (!cacheData.cachedAt) {
        console.log(
          "[DatabaseManager] Cache data exists but no cachedAt timestamp"
        );
        return { hasCache: false, isExpired: true };
      }

      const now = Date.now();
      const cacheAgeMs = now - cacheData.cachedAt;
      const ageMinutes = Math.floor(cacheAgeMs / (1000 * 60));
      const isExpired = this.isCacheExpired(cacheData);

      console.log("[DatabaseManager] Cache info calculated:", {
        hasCache: true,
        cachedAt: cacheData.cachedAt,
        isExpired,
        ageMinutes,
        cacheAgeMs,
        ageSeconds: Math.floor(cacheAgeMs / 1000),
      });

      return {
        hasCache: true,
        cachedAt: cacheData.cachedAt,
        isExpired,
        ageMinutes,
      };
    } catch (error) {
      console.error("[DatabaseManager] Error getting cache info:", error);
      return { hasCache: false, isExpired: true };
    }
  }
}
