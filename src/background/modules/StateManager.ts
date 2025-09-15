import type { CaptionState } from "@/store/captionStore";

const TAB_STATE_MAP_KEY = "tab_caption_states";

export class StateManager {
  /**
   * Updates and stores state for specific tab
   */
  static async updateState(
    tabId: number,
    newState: Partial<CaptionState>
  ): Promise<void> {
    const { [TAB_STATE_MAP_KEY]: tabStates = {} } =
      await chrome.storage.session.get(TAB_STATE_MAP_KEY);

    tabStates[tabId] = { ...(tabStates[tabId] || {}), ...newState };

    await chrome.storage.session.set({ [TAB_STATE_MAP_KEY]: tabStates });
  }

  /**
   * Gets saved state for specific tab
   */
  static async getState(tabId: number): Promise<CaptionState | null> {
    const { [TAB_STATE_MAP_KEY]: tabStates = {} } =
      await chrome.storage.session.get(TAB_STATE_MAP_KEY);
    return tabStates[tabId] || null;
  }

  /**
   * Deletes state for tab (e.g., when tab is closed)
   */
  static async clearState(tabId: number): Promise<void> {
    const { [TAB_STATE_MAP_KEY]: tabStates = {} } =
      await chrome.storage.session.get(TAB_STATE_MAP_KEY);
    delete tabStates[tabId];
    await chrome.storage.session.set({ [TAB_STATE_MAP_KEY]: tabStates });
  }
}
