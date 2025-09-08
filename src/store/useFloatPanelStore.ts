import { create } from "zustand";
import { FloatPanelState } from "@/types";

interface FloatPanelStore extends FloatPanelState {
  show: () => void;
  hide: () => void;
  toggle: () => void;
  setPosition: (x: number, y: number) => void;
  setSize: (width: number, height: number) => void;
  reset: () => void;
}

const initialState: FloatPanelState = {
  isVisible: true,
  position: {
    x: 100,
    y: 100,
  },
  size: {
    width: 400,
    height: 300,
  },
};

export const useFloatPanelStore = create<FloatPanelStore>((set) => ({
  ...initialState,

  show: () => set({ isVisible: true }),

  hide: () => set({ isVisible: false }),

  toggle: () => set((state) => ({ isVisible: !state.isVisible })),

  setPosition: (x, y) =>
    set((state) => ({
      position: { ...state.position, x, y },
    })),

  setSize: (width, height) =>
    set((state) => ({
      size: { ...state.size, width, height },
    })),

  reset: () => set(initialState),
}));
