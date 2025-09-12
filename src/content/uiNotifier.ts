/**
 * Модуль для відображення UI повідомлень користувачу
 * Винесено з captionIntegration.ts для покращення архітектури
 */

export type NotificationType = "success" | "error" | "warning" | "info";

/**
 * Показує повідомлення користувачу про стан субтитрів
 */
export function showCaptionNotification(
  message: string,
  type: NotificationType = "info"
) {
  const notification = document.createElement("div");
  notification.className = `caption-notification caption-notification-${type}`;
  notification.textContent = message;

  // Стилі для повідомлень
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 16px;
    border-radius: 8px;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
  `;

  // Кольори для різних типів повідомлень
  const colors = {
    success: "#10B981",
    error: "#EF4444",
    warning: "#F59E0B",
    info: "#3B82F6",
  };

  notification.style.backgroundColor = colors[type] || colors.info;

  document.body.appendChild(notification);

  // Автоматично прибираємо повідомлення через 5 секунд
  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform = "translateX(100%)";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 5000);
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
