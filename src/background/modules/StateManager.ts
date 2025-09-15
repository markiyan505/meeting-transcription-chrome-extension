// src/background/modules/StateManager.ts
import type { CaptionState } from '@/store/captionStore';

const TAB_STATE_MAP_KEY = 'tab_caption_states';

export class StateManager {
  /**
   * Оновлює та зберігає стан для конкретної вкладки
   */
  static async updateState(tabId: number, newState: Partial<CaptionState>): Promise<void> {
    const { [TAB_STATE_MAP_KEY]: tabStates = {} } = await chrome.storage.session.get(TAB_STATE_MAP_KEY);
    
    // Оновлюємо стан для цієї вкладки, зберігаючи попередні значення
    tabStates[tabId] = { ...(tabStates[tabId] || {}), ...newState };
    
    await chrome.storage.session.set({ [TAB_STATE_MAP_KEY]: tabStates });
  }

  /**
   * Отримує збережений стан для конкретної вкладки
   */
  static async getState(tabId: number): Promise<CaptionState | null> {
    const { [TAB_STATE_MAP_KEY]: tabStates = {} } = await chrome.storage.session.get(TAB_STATE_MAP_KEY);
    return tabStates[tabId] || null;
  }

  /**
   * Видаляє стан для вкладки (наприклад, при її закритті)
   */
  static async clearState(tabId: number): Promise<void> {
    const { [TAB_STATE_MAP_KEY]: tabStates = {} } = await chrome.storage.session.get(TAB_STATE_MAP_KEY);
    delete tabStates[tabId];
    await chrome.storage.session.set({ [TAB_STATE_MAP_KEY]: tabStates });
  }
}