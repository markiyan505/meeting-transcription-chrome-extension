/**
 * Головний модуль для роботи з субтитрами
 * Експортує всі необхідні класи та типи
 */

// Експорт типів
export * from "./types";

// Експорт основних класів
export { CaptionManager } from "./CaptionManager";
export { AdapterFactory } from "./AdapterFactory";

// Імпорт для використання в функціях
import { CaptionManager } from "./CaptionManager";
import { AdapterFactory } from "./AdapterFactory";

// Експорт адаптерів
export { TranscriptonicAdapter } from "./adapters/TranscriptonicAdapter";
export { LiveCaptionsAdapter } from "./adapters/LiveCaptionsAdapter";

// Експорт утиліт
export {
  createCaptionManager,
  logCaptionEvent,
  handleCaptionError,
} from "./utils";

/**
 * Швидкий доступ до створення менеджера субтитрів
 */
export async function createCaptionManagerForCurrentPlatform(config?: any) {
  const factory = AdapterFactory.getInstance();
  const adapter = factory.createAdapterForCurrentPlatform(config);

  if (!adapter) {
    throw new Error("No adapter available for current platform");
  }

  const manager = new CaptionManager();
  await manager.initialize(adapter);

  return manager;
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
