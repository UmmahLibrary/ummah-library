/**
 * The **web adapter** for the core {@link Notifier} port. It uses the browser
 * Notifications API and in-page `setTimeout`, so a scheduled notification only
 * fires while a tab is open — the honest limit of a no-backend, local-first app
 * (ADR 0017, 0019). The reminder *logic* lives in `core` (`prayerReminders`);
 * this class is only the delivery mechanism, so a service-worker / Web Push or
 * Expo adapter can replace it behind the same port without touching the logic.
 */
import type { AppNotification, Notifier, NotifyPermission } from "@ummahlibrary/core";

// setTimeout delays are stored as a signed 32-bit int; a larger delay overflows
// and fires immediately. Prayer reminders are always within a day, well under it.
const MAX_TIMEOUT = 0x7fffffff;

export class WebNotifier implements Notifier {
  readonly #timers = new Map<string, ReturnType<typeof setTimeout>>();

  isSupported(): boolean {
    return typeof window !== "undefined" && "Notification" in window;
  }

  permission(): NotifyPermission {
    return this.isSupported() ? Notification.permission : "unsupported";
  }

  async requestPermission(): Promise<NotifyPermission> {
    if (!this.isSupported()) return "unsupported";
    if (Notification.permission !== "default") return Notification.permission;
    try {
      return await Notification.requestPermission();
    } catch {
      return Notification.permission;
    }
  }

  schedule(notification: AppNotification): Promise<void> {
    this.#clear(notification.id);
    if (this.permission() !== "granted") return Promise.resolve();

    const delay = notification.at ? new Date(notification.at).getTime() - Date.now() : 0;
    if (delay > MAX_TIMEOUT) return Promise.resolve();
    if (delay <= 0) {
      this.#fire(notification);
      return Promise.resolve();
    }
    this.#timers.set(
      notification.id,
      setTimeout(() => {
        this.#timers.delete(notification.id);
        this.#fire(notification);
      }, delay),
    );
    return Promise.resolve();
  }

  cancel(id: string): Promise<void> {
    this.#clear(id);
    return Promise.resolve();
  }

  cancelAll(): Promise<void> {
    for (const id of [...this.#timers.keys()]) this.#clear(id);
    return Promise.resolve();
  }

  #clear(id: string): void {
    const timer = this.#timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.#timers.delete(id);
    }
  }

  #fire(notification: AppNotification): void {
    try {
      new Notification(notification.title, {
        body: notification.body,
        tag: notification.tag ?? notification.id,
        icon: "/icons/icon-192.png",
      });
    } catch {
      /* delivery unavailable (e.g. requires a service worker on some platforms) */
    }
  }
}
