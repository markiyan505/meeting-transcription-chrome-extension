/**
 * Модуль для відображення UI повідомлень користувачу
 * Винесено з captionIntegration.ts для покращення архітектури
 */

export type NotificationType = "success" | "error" | "warning" | "info";

// Глобальна черга повідомлень
let notificationQueue: Array<{
  id: string;
  element: HTMLElement;
  type: NotificationType;
  message: string;
  originalMessage: string;
  count: number;
  timeoutId: number;
}> = [];

let notificationContainer: HTMLElement | null = null;

// Максимальна кількість повідомлень одночасно
const MAX_NOTIFICATIONS = 3;

/**
 * Ініціалізує контейнер для повідомлень
 */
function initializeNotificationContainer() {
  if (notificationContainer) return;

  notificationContainer = document.createElement("div");
  notificationContainer.id = "caption-notifications-container";
  notificationContainer.className = "notification-container";

  document.body.appendChild(notificationContainer);
}

/**
 * Оновлює позиції всіх повідомлень
 */
function updateNotificationPositions() {
  notificationQueue.forEach((notification, index) => {
    // Використовуємо margin-top замість transform для кращої сумісності з flexbox
    if (index === 0) {
      notification.element.style.marginTop = "0px";
    } else {
      notification.element.style.marginTop = "8px"; // gap між повідомленнями
    }
    // Скидаємо transform для вертикального позиціонування
    notification.element.style.transform = "none";
  });
}

/**
 * Видаляє повідомлення з черги
 */
function removeNotificationFromQueue(id: string) {
  const index = notificationQueue.findIndex((n) => n.id === id);
  if (index !== -1) {
    notificationQueue.splice(index, 1);
    updateNotificationPositions();
  }
}

/**
 * Видаляє найстаріше повідомлення з черги
 */
function removeOldestNotification() {
  if (notificationQueue.length > 0) {
    const oldest = notificationQueue.shift();
    if (oldest) {
      removeNotification(oldest.id);
    }
  }
}

/**
 * Перевіряє, чи існує вже таке ж повідомлення
 */
function isDuplicateNotification(
  message: string,
  type: NotificationType
): boolean {
  return notificationQueue.some(
    (notification) =>
      notification.originalMessage === message && notification.type === type
  );
}

/**
 * Оновлює існуюче повідомлення (скидає таймер та збільшує лічильник)
 */
function updateExistingNotification(
  message: string,
  type: NotificationType
): void {
  const existing = notificationQueue.find(
    (notification) =>
      notification.originalMessage === message && notification.type === type
  );

  if (existing) {
    // Скидаємо старий таймер
    clearTimeout(existing.timeoutId);

    // Збільшуємо лічильник
    existing.count++;

    // Оновлюємо текст повідомлення
    if (existing.count > 1) {
      existing.element.textContent = `${existing.originalMessage} (${existing.count})`;
    } else {
      existing.element.textContent = existing.originalMessage;
    }

    // Встановлюємо новий таймер
    existing.timeoutId = window.setTimeout(() => {
      removeNotification(existing.id);
    }, 5000);

    console.log(
      `[NOTIFICATION] Updated existing: ${message} (count: ${existing.count})`
    );
  }
}

/**
 * Показує повідомлення користувачу про стан субтитрів
 */
export function showCaptionNotification(
  message: string,
  type: NotificationType = "info"
) {
  initializeNotificationContainer();

  // Перевіряємо на дублікати та оновлюємо існуюче
  if (isDuplicateNotification(message, type)) {
    updateExistingNotification(message, type);
    return;
  }

  // Якщо досягли ліміту, видаляємо найстаріше повідомлення
  if (notificationQueue.length >= MAX_NOTIFICATIONS) {
    removeOldestNotification();
  }

  const id = `notification-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)}`;

  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.dataset.notificationId = id;

  // Додаємо в контейнер
  notificationContainer!.appendChild(notification);

  // Автоматично прибираємо повідомлення через 5 секунд
  const timeoutId = window.setTimeout(() => {
    removeNotification(id);
  }, 5000);

  // Додаємо в чергу
  notificationQueue.push({
    id,
    element: notification,
    type,
    message,
    originalMessage: message,
    count: 1,
    timeoutId,
  });

  // Анімація появи
  requestAnimationFrame(() => {
    notification.classList.add("notification-visible");
    updateNotificationPositions();
  });

  // Обробник кліку для закриття
  notification.addEventListener("click", () => {
    removeNotification(id);
  });
}

/**
 * Видаляє повідомлення
 */
function removeNotification(id: string) {
  const notification = notificationQueue.find((n) => n.id === id);
  if (!notification) return;

  // Скасовуємо timeout
  clearTimeout(notification.timeoutId);

  // Анімація зникнення
  notification.element.classList.remove("notification-visible");
  notification.element.classList.add("notification-hidden");

  setTimeout(() => {
    if (notification.element.parentNode) {
      notification.element.parentNode.removeChild(notification.element);
    }
    removeNotificationFromQueue(id);
  }, 300);
}

/**
 * Очищає всі повідомлення
 */
export function clearAllNotifications() {
  notificationQueue.forEach((notification) => {
    removeNotification(notification.id);
  });
}

/**
 * Очищає дублікати повідомлень
 */
export function clearDuplicateNotifications() {
  const seen = new Set<string>();
  const toRemove: string[] = [];

  notificationQueue.forEach((notification) => {
    const key = `${notification.type}-${notification.originalMessage}`;
    if (seen.has(key)) {
      toRemove.push(notification.id);
    } else {
      seen.add(key);
    }
  });

  toRemove.forEach((id) => removeNotification(id));
  console.log(`[NOTIFICATION] Removed ${toRemove.length} duplicates`);
}

/**
 * Показує повідомлення про помилку
 */
export function showErrorNotification(message: string) {
  showCaptionNotification(message, "error");
}

/**
 * Показує повідомлення про успіх
 */
export function showSuccessNotification(message: string) {
  showCaptionNotification(message, "success");
}

/**
 * Показує попереджувальне повідомлення
 */
export function showWarningNotification(message: string) {
  showCaptionNotification(message, "warning");
}

/**
 * Показує інформаційне повідомлення
 */
export function showInfoNotification(message: string) {
  showCaptionNotification(message, "info");
}

/**
 * Показує повідомлення з можливістю дії
 */
export function showActionNotification(
  message: string,
  actionText: string,
  onAction: () => void,
  type: NotificationType = "info"
) {
  initializeNotificationContainer();

  // Якщо досягли ліміту, видаляємо найстаріше повідомлення
  if (notificationQueue.length >= MAX_NOTIFICATIONS) {
    removeOldestNotification();
  }

  const id = `notification-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)}`;

  const notification = document.createElement("div");
  notification.className = `notification notification-${type} notification-action`;
  notification.dataset.notificationId = id;

  notification.innerHTML = `
    <div class="notification-content">${message}</div>
    <button class="notification-button">
      ${actionText}
    </button>
  `;

  // Додаємо в контейнер
  notificationContainer!.appendChild(notification);

  // Автоматично прибираємо повідомлення через 8 секунд (довше для дій)
  const timeoutId = window.setTimeout(() => {
    removeNotification(id);
  }, 8000);

  // Додаємо в чергу
  notificationQueue.push({
    id,
    element: notification,
    type,
    message,
    originalMessage: message,
    count: 1,
    timeoutId,
  });

  // Анімація появи
  requestAnimationFrame(() => {
    notification.classList.add("notification-visible");
    updateNotificationPositions();
  });

  // Обробник кліку на кнопку
  const button = notification.querySelector("button");
  if (button) {
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      onAction();
      removeNotification(id);
    });
  }

  // Обробник кліку на повідомлення для закриття
  notification.addEventListener("click", () => {
    removeNotification(id);
  });
}
