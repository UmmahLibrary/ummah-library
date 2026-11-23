/**
 * Shared feedback for a notification-permission request that didn't result
 * in "granted" — every reminder toggle silently left the switch off with no
 * explanation before this existed (iteration 16 logged the gap, iteration
 * 56 closed it). `Linking.openSettings()` is the only way back in from a
 * permanent denial (Android's "Don't ask again", iOS after a first
 * decline) — the OS won't re-show its own prompt.
 *
 * Not a component, so it can't use hooks: callers pass their `t` (from
 * `useT()`) and an already-translated reminder label. Without `t` the text
 * falls back to English.
 */
import { Alert, Linking } from "react-native";
import { fmtMessage } from "@ummahlibrary/core";
import { type MessageKey, en } from "./i18n/messages";

export function notifyNotificationPermissionDenied(
  reminderLabel: string,
  t: (key: MessageKey) => string = (key) => en[key],
): void {
  Alert.alert(
    t("pr.notifOffTitle"),
    fmtMessage(t("pr.notifOffBody"), { reminder: reminderLabel }),
    [
      { text: t("pr.notNow"), style: "cancel" },
      { text: t("pr.openSettings"), onPress: () => void Linking.openSettings().catch(() => {}) },
    ],
  );
}
