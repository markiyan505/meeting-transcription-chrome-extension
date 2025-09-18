/**
 * Утиліти з оригінального TranscripTonic
 * Перенесені дослівно для збереження надійності
 */

/**
 * Селекція елементів за текстом (з оригіналу)
 * @param {string} selector
 * @param {string | RegExp} text
 */
export function selectElements(selector: string, text: string | RegExp): any {
  var elements = document.querySelectorAll(selector);
  return Array.prototype.filter.call(elements, function (element) {
    return RegExp(text).test(element.textContent);
  });
}


/**
 * Ефективне очікування елементів з анімаційними кадрами (з оригіналу)
 * @param {string} selector
 * @param {string | RegExp} [text]
 */
export async function waitForElement(
  selector: string,
  text?: string | RegExp
): Promise<Element> {
  if (text) {
    // loops for every animation frame change, until the required element is found
    while (
      !Array.from(document.querySelectorAll(selector)).find(
        (element) => element.textContent === text
      )
    ) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  } else {
    // loops for every animation frame change, until the required element is found
    while (!document.querySelector(selector)) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  }
  return document.querySelector(selector)!;
}

/**
 * Система обробки помилок (з оригіналу)
 */
export class ErrorHandler {
  private static errorFlags = new Map<string, boolean>();

  static log(
    error: Error,
    context: string = "",
    silent: boolean = false
  ): void {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      context,
      error: error.message,
      stack: error.stack,
    };

    if (!silent) {
      console.error(`[${context}] ${timestamp}:`, errorInfo);
    }

    // Логування помилки тільки один раз
    if (!this.errorFlags.get(context)) {
      this.errorFlags.set(context, true);
      // Можна додати відправку на сервер аналітики
    }
  }

  static wrap<T extends (...args: any[]) => any>(
    fn: T,
    context: string = ""
  ): T {
    return ((...args: Parameters<T>) => {
      try {
        return fn.apply(this, args);
      } catch (error) {
        this.log(error as Error, context);
        throw error;
      }
    }) as T;
  }
}

