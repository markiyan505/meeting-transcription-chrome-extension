/**
 * Утиліти для роботи з субтитрами
 */

import { CaptionManager } from "./CaptionManager";
import { AdapterFactory } from "./AdapterFactory";
import { CaptionAdapter } from "./types";
import { AdapterFactoryConfig } from "./AdapterFactory";

/**
 * Створює менеджер субтитрів з автоматичним вибором адаптера
 */
export async function createCaptionManager(
  config?: AdapterFactoryConfig
): Promise<CaptionManager> {
  const factory = AdapterFactory.getInstance();
  const adapter = factory.createAdapterForCurrentPlatform(config);

  if (!adapter) {
    throw new Error("No adapter available for current platform");
  }

  const manager = new CaptionManager();
  const result = await manager.initialize(adapter);

  if (!result.success) {
    throw new Error(`Failed to initialize caption manager: ${result.error}`);
  }

  return manager;
}

/**
 * Створює менеджер субтитрів з конкретним адаптером
 */
export async function createCaptionManagerWithAdapter(
  adapter: CaptionAdapter
): Promise<CaptionManager> {
  const manager = new CaptionManager();
  const result = await manager.initialize(adapter);

  if (!result.success) {
    throw new Error(`Failed to initialize caption manager: ${result.error}`);
  }

  return manager;
}

/**
 * Отримує глобальний екземпляр менеджера субтитрів
 */
let globalCaptionManager: CaptionManager | null = null;

export async function getGlobalCaptionManager(
  config?: AdapterFactoryConfig
): Promise<CaptionManager> {
  if (!globalCaptionManager) {
    globalCaptionManager = await createCaptionManager(config);
  }
  return globalCaptionManager;
}

/**
 * Очищає глобальний екземпляр менеджера субтитрів
 */
export async function cleanupGlobalCaptionManager(): Promise<void> {
  if (globalCaptionManager) {
    await globalCaptionManager.cleanup();
    globalCaptionManager = null;
  }
}

/**
 * Перевіряє, чи доступний глобальний менеджер
 */
export function isGlobalCaptionManagerAvailable(): boolean {
  return globalCaptionManager !== null && globalCaptionManager.initialized;
}

/**
 * Форматує час у читабельному вигляді
 */
export function formatTime(timestamp: string | Date): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  return date.toLocaleTimeString();
}

/**
 * Форматує тривалість у читабельному вигляді
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}:${(minutes % 60).toString().padStart(2, "0")}:${(
      seconds % 60
    )
      .toString()
      .padStart(2, "0")}`;
  } else {
    return `${minutes}:${(seconds % 60).toString().padStart(2, "0")}`;
  }
}

/**
 * Валідує конфігурацію адаптера
 */
export function validateAdapterConfig(config: any): boolean {
  if (!config || typeof config !== "object") {
    return false;
  }

  // Базові перевірки
  if (config.platform && typeof config.platform !== "string") {
    return false;
  }

  if (
    config.autoEnableCaptions !== undefined &&
    typeof config.autoEnableCaptions !== "boolean"
  ) {
    return false;
  }

  if (
    config.autoSaveOnEnd !== undefined &&
    typeof config.autoSaveOnEnd !== "boolean"
  ) {
    return false;
  }

  if (
    config.trackAttendees !== undefined &&
    typeof config.trackAttendees !== "boolean"
  ) {
    return false;
  }

  if (
    config.operationMode &&
    !["manual", "automatic"].includes(config.operationMode)
  ) {
    return false;
  }

  return true;
}

/**
 * Створює конфігурацію за замовчуванням
 */
export function createDefaultConfig(): AdapterFactoryConfig {
  return {
    autoEnableCaptions: true,
    autoSaveOnEnd: true,
    trackAttendees: true,
    operationMode: "automatic",
  };
}

/**
 * Мержить конфігурації
 */
export function mergeConfigs(
  defaultConfig: AdapterFactoryConfig,
  userConfig?: AdapterFactoryConfig
): AdapterFactoryConfig {
  return {
    ...defaultConfig,
    ...userConfig,
  };
}

/**
 * Логує події субтитрів
 */
export function logCaptionEvent(event: string, data: any): void {
  console.log(`[CaptionManager] ${event}:`, data);
}

/**
 * Обробляє помилки
 */
export function handleCaptionError(error: Error, context: string): void {
  console.error(`[CaptionManager] Error in ${context}:`, error);
}

/**
 * Дебаунс функція
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Тротлінг функція
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Перевіряє, чи є елемент у DOM
 */
export function waitForElement(
  selector: string,
  timeout = 5000
): Promise<Element> {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

/**
 * Отримує унікальний ID
 */
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Безпечно парсить JSON
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Безпечно серіалізує в JSON
 */
export function safeJsonStringify(obj: any, fallback = "{}"): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return fallback;
  }
}
