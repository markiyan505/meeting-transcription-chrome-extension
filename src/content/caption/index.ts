/**
 * Головний модуль для роботи з субтитрами
 * Експортує всі необхідні класи та типи
 */

// Експорт типів
export * from "./types";

// Експорт основних класів
export { AdapterFactory } from "./AdapterFactory";

// Імпорт для використання в функціях
import { AdapterFactory } from "./AdapterFactory";

// Експорт адаптерів
export { TranscriptonicAdapter } from "./adapters/TranscriptonicAdapter";
export { LiveCaptionsAdapter } from "./adapters/LiveCaptionsAdapter";

// Експорт утиліт
export { logCaptionEvent, handleCaptionError } from "./utils";

/**
 * Швидкий доступ до створення адаптера субтитрів
 */
export async function createCaptionAdapterForCurrentPlatform(config?: any) {
  const factory = AdapterFactory.getInstance();
  const adapter = factory.createAdapterForCurrentPlatform(config);

  if (!adapter) {
    throw new Error("No adapter available for current platform");
  }

  const initResult = await adapter.initialize();
  if (!initResult.success) {
    throw new Error(`Failed to initialize adapter: ${initResult.error}`);
  }

  return adapter;
}

/**
 * Перевіряє, чи підтримується поточна платформа
 */
export function isCurrentPlatformSupported(): boolean {
  const factory = AdapterFactory.getInstance();
  const platform = factory.detectPlatform();
  return factory.isPlatformSupported(platform);
}

/**
 * Отримує інформацію про поточну платформу
 */
export function getCurrentPlatformInfo() {
  const factory = AdapterFactory.getInstance();
  const platform = factory.detectPlatform();
  return factory.getPlatformInfo(platform);
}
