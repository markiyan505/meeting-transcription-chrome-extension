/**
 * Module for displaying UI messages to the user
 */

export type NotificationType = "success" | "error" | "warning" | "info";

// Global queue of messages
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

// Maximum number of messages at once
const MAX_NOTIFICATIONS = 3;

/**
 * Initializes the container for messages
 */
function initializeNotificationContainer() {
  if (notificationContainer) return;

  notificationContainer = document.createElement("div");
  notificationContainer.id = "caption-notifications-container";
  notificationContainer.className = "notification-container";

  document.body.appendChild(notificationContainer);
}

/**
 * Updates the positions of all messages
 */
function updateNotificationPositions() {
  notificationQueue.forEach((notification, index) => {
    if (index === 0) {
      notification.element.style.marginTop = "0px";
    } else {
      notification.element.style.marginTop = "8px"; 
    }
    notification.element.style.transform = "none";
  });
}

/**
 * Removes a message from the queue
 */
function removeNotificationFromQueue(id: string) {
  const index = notificationQueue.findIndex((n) => n.id === id);
  if (index !== -1) {
    notificationQueue.splice(index, 1);
    updateNotificationPositions();
  }
}

/**
 * Removes the oldest message from the queue
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
 * Checks if a message already exists
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
 * Updates an existing message (resets the timer and increases the counter)
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
    clearTimeout(existing.timeoutId);

    existing.count++;

    if (existing.count > 1) {
      existing.element.textContent = `${existing.originalMessage} (${existing.count})`;
    } else {
      existing.element.textContent = existing.originalMessage;
    }

    existing.timeoutId = window.setTimeout(() => {
      removeNotification(existing.id);
    }, 5000);
  }
}

/**
 * Shows a message to the user about the caption status
 */
export function showCaptionNotification(
  message: string,
  type: NotificationType = "info"
) {
  initializeNotificationContainer();

  if (isDuplicateNotification(message, type)) {
    updateExistingNotification(message, type);
    return;
  }

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

  notificationContainer!.appendChild(notification);

  const timeoutId = window.setTimeout(() => {
    removeNotification(id);
  }, 5000);

  notificationQueue.push({
    id,
    element: notification,
    type,
    message,
    originalMessage: message,
    count: 1,
    timeoutId,
  });

  requestAnimationFrame(() => {
    notification.classList.add("notification-visible");
    updateNotificationPositions();
  });

  notification.addEventListener("click", () => {
    removeNotification(id);
  });
}

/**
 * Removes a message
 */
function removeNotification(id: string) {
  const notification = notificationQueue.find((n) => n.id === id);
  if (!notification) return;

  clearTimeout(notification.timeoutId);

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
 * Clears all messages
 */
export function clearAllNotifications() {
  notificationQueue.forEach((notification) => {
    removeNotification(notification.id);
  });
}

/**
 * Clears duplicate messages
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
}

/**
 * Shows an error message
 */
export function showErrorNotification(message: string) {
  showCaptionNotification(message, "error");
}

/**
 * Shows a success message
 */
export function showSuccessNotification(message: string) {
  showCaptionNotification(message, "success");
}

/**
 * Shows a warning message
 */
export function showWarningNotification(message: string) {
  showCaptionNotification(message, "warning");
}

/**
 * Shows an informational message
 */
export function showInfoNotification(message: string) {
  showCaptionNotification(message, "info");
}

/**
 * Shows a message with an action
 */
export function showActionNotification(
  message: string,
  actionText: string,
  onAction: () => void,
  type: NotificationType = "info"
) {
  initializeNotificationContainer();

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

  notificationContainer!.appendChild(notification);

  const timeoutId = window.setTimeout(() => {
    removeNotification(id);
  }, 8000);

  notificationQueue.push({
    id,
    element: notification,
    type,
    message,
    originalMessage: message,
    count: 1,
    timeoutId,
  });

  requestAnimationFrame(() => {
    notification.classList.add("notification-visible");
    updateNotificationPositions();
  });

  const button = notification.querySelector("button");
  if (button) {
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      onAction();
      removeNotification(id);
    });
  }

  notification.addEventListener("click", () => {
    removeNotification(id);
  });
}
