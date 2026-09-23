/**
 * Shared feedback for a notification-permission request that didn't result
 * in "granted" — every reminder toggle silently left the switch off with no
 * explanation before this existed (iteration 16 logged the gap, iteration
 * 56 closed it). `Linking.openSettings()` is the only way back in from a
 * permanent denial (Android's "Don't ask again", iOS after a first
 * decline) — the OS won't re-show its own prompt.
 */
import { Alert, Linking } from "react-native";

export function notifyNotificationPermissionDenied(reminderLabel: string): void {
  Alert.alert("Notifications are off", `Enable notifications in Settings to get your ${reminderLabel}.`, [
    { text: "Not now", style: "cancel" },
    { text: "Open Settings", onPress: () => void Linking.openSettings() },
  ]);
}
