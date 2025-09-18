import { create } from "zustand";
import { UserProfile } from "@/background/modules/DatabaseManager";

// Debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export interface UserProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Async actions - спрощені, логіка в background
  fetchProfile: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearProfile: () => void;
}

export const useUserProfileStore = create<UserProfileState>((set, get) => ({
  profile: null,
  isLoading: false,
  error: null,

  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  fetchProfile: async () => {
    set({ isLoading: true, error: null });

    try {
      console.log("[USER_PROFILE] Fetching profile...");
      const response = await chrome.runtime.sendMessage({
        type: "QUERY.USER.GET_PROFILE",
      });

      if (response?.success) {
        console.log("[USER_PROFILE] Profile fetched successfully:", {
          hasProfile: !!response.profile,
          email: response.profile?.email,
        });
        set({
          profile: response.profile,
          isLoading: false,
          error: null,
        });
      } else {
        console.error(
          "[USER_PROFILE] Failed to fetch profile:",
          response?.error
        );
        set({
          error: response?.error || "Failed to fetch profile",
          isLoading: false,
        });
      }
    } catch (error) {
      console.error("[USER_PROFILE] Error fetching profile:", error);
      set({
        error: error instanceof Error ? error.message : String(error),
        isLoading: false,
      });
    }
  },

  refreshProfile: async () => {
    set({ isLoading: true, error: null });

    try {
      console.log("[USER_PROFILE] Refreshing profile...");
      await chrome.runtime.sendMessage({
        type: "COMMAND.USER.REFRESH_PROFILE",
      });

      await get().fetchProfile();
    } catch (error) {
      console.error("[USER_PROFILE] Error refreshing profile:", error);
      set({
        error: error instanceof Error ? error.message : String(error),
        isLoading: false,
      });
    }
  },

  clearProfile: () => {
    console.log("[USER_PROFILE] Clearing profile");
    set({
      profile: null,
      error: null,
      isLoading: false,
    });
  },
}));

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "EVENT.USER.PROFILE_CHANGED") {
    console.log(
      "[USER_PROFILE] Received profile change event:",
      message.payload
    );

    const { hasProfile, profile } = message.payload;

    if (hasProfile && profile) {
      useUserProfileStore.getState().setProfile(profile);
    } else {
      useUserProfileStore.getState().clearProfile();
    }
  }
});
