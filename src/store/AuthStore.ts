import { create } from "zustand";
import { Session } from "@supabase/supabase-js";

export interface AuthState {
  session: Session | null;
  isAuthenticated: boolean;
  tokenExpiry?: number;
  user?: any;

  _setSession: (session: Session | null) => void;
  refreshToken: () => Promise<void>;
  clearSession: () => void;

  _syncState: (newState: Partial<AuthState>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  isAuthenticated: false,
  tokenExpiry: undefined,
  user: undefined,

  _setSession: (session) =>
    set({
      session,
      isAuthenticated: !!session?.access_token,
      tokenExpiry: session?.expires_at,
      user: session?.user,
    }),

  refreshToken: async () => {
    try {
      console.log("[AUTH] Requesting token refresh...");
      const response = await chrome.runtime.sendMessage({
        type: "COMMAND.AUTH.REFRESH_TOKEN",
      });

      if (response?.success) {
        console.log("[AUTH] Token refreshed successfully");
        if (response.expiresAt) {
          set({
            tokenExpiry: Math.floor(
              new Date(response.expiresAt).getTime() / 1000
            ),
          });
        }
      } else {
        console.error("[AUTH] Token refresh failed:", response?.error);
      }
    } catch (error) {
      console.error("[AUTH] Error refreshing token:", error);
    }
  },

  clearSession: () => {
    console.log("[AUTH] Clearing session...");
    set({
      session: null,
      isAuthenticated: false,
      tokenExpiry: undefined,
      user: undefined,
    });
  },

  _syncState: (newState) => set((state) => ({ ...state, ...newState })),
}));

// Слухач повідомлень для автоматичного оновлення стану
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "EVENT.AUTH.STATE_CHANGED") {
    console.log("[AUTH] Received auth state change event:", message.payload);

    const { hasSession, session } = message.payload;

    if (hasSession && session) {
      useAuthStore.getState()._setSession(session);
    } else {
      useAuthStore.getState().clearSession();
    }
  }
});
