import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppNotification } from "@ummahlibrary/core";
import { WebNotifier } from "./web-notifier";

/** A minimal stand-in for the browser Notification API. */
function stubNotification(permission: NotificationPermission) {
  const instances: { title: string; options?: NotificationOptions }[] = [];
  const ctor = vi.fn(function (this: unknown, title: string, options?: NotificationOptions) {
    instances.push({ title, options });
  }) as unknown as typeof Notification;
  Object.assign(ctor, {
    permission,
    requestPermission: vi.fn(async () => "granted" as NotificationPermission),
  });
  vi.stubGlobal("Notification", ctor);
  return { ctor, instances };
}

const note = (over: Partial<AppNotification> = {}): AppNotification => ({
  id: "fajr",
  title: "Fajr",
  body: "Time for Fajr",
  ...over,
});

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("WebNotifier", () => {
  it("reports support and permission from the Notification API", () => {
    stubNotification("granted");
    const n = new WebNotifier();
    expect(n.isSupported()).toBe(true);
    expect(n.permission()).toBe("granted");
  });

  it("reports unsupported when the API is absent", () => {
    // jsdom has no Notification, and afterEach unstubs any from other tests.
    const n = new WebNotifier();
    expect(n.isSupported()).toBe(false);
    expect(n.permission()).toBe("unsupported");
  });

  it("requests permission only when still default", async () => {
    const { ctor } = stubNotification("default");
    const n = new WebNotifier();
    expect(await n.requestPermission()).toBe("granted");
    expect((ctor as unknown as { requestPermission: () => unknown }).requestPermission).toHaveBeenCalled();
  });

  it("short-circuits a permission request that is already decided", async () => {
    const { ctor } = stubNotification("denied");
    const n = new WebNotifier();
    expect(await n.requestPermission()).toBe("denied");
    expect((ctor as unknown as { requestPermission: () => unknown }).requestPermission).not.toHaveBeenCalled();
  });

  it("fires immediately when there is no future time", async () => {
    const { instances } = stubNotification("granted");
    const n = new WebNotifier();
    await n.schedule(note());
    expect(instances).toHaveLength(1);
    expect(instances[0]?.title).toBe("Fajr");
  });

  it("defers a future notification until its timer elapses", async () => {
    const { instances } = stubNotification("granted");
    const n = new WebNotifier();
    await n.schedule(note({ at: new Date(Date.now() + 1000).toISOString() }));
    expect(instances).toHaveLength(0);
    vi.advanceTimersByTime(1000);
    expect(instances).toHaveLength(1);
  });

  it("does nothing without granted permission", async () => {
    const { instances } = stubNotification("default");
    const n = new WebNotifier();
    await n.schedule(note());
    expect(instances).toHaveLength(0);
  });

  it("cancels a pending notification before it fires", async () => {
    const { instances } = stubNotification("granted");
    const n = new WebNotifier();
    await n.schedule(note({ at: new Date(Date.now() + 1000).toISOString() }));
    await n.cancel("fajr");
    vi.advanceTimersByTime(1000);
    expect(instances).toHaveLength(0);
  });

  it("cancels every pending notification", async () => {
    const { instances } = stubNotification("granted");
    const n = new WebNotifier();
    const future = new Date(Date.now() + 1000).toISOString();
    await n.schedule(note({ id: "fajr", at: future }));
    await n.schedule(note({ id: "isha", at: future }));
    await n.cancelAll();
    vi.advanceTimersByTime(1000);
    expect(instances).toHaveLength(0);
  });
});
