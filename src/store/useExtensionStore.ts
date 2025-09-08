import { create } from "zustand";
import { ExtensionState, Theme } from "@/types";

interface ExtensionStore extends ExtensionState {
  setActive: (active: boolean) => void;
  setCurrentTab: (tab: chrome.tabs.Tab) => void;
  setTheme: (theme: Theme) => void;
  setAutoOpen: (autoOpen: boolean) => void;
  reset: () => void;
}

const initialState: ExtensionState = {
  isActive: true,
  currentTab: undefined,
  settings: {
    theme: "light",
    autoOpen: true,
  },
};

export const useExtensionStore = create<ExtensionStore>((set) => ({
  ...initialState,

  setActive: (active) => set({ isActive: active }),

  setCurrentTab: (tab) => set({ currentTab: tab }),

  setTheme: (theme) =>
    set((state) => ({
      settings: { ...state.settings, theme },
    })),

  setAutoOpen: (autoOpen) =>
    set((state) => ({
      settings: { ...state.settings, autoOpen },
    })),

  reset: () => set(initialState),
}));
