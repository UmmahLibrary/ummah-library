import type { ReactNode } from "react";
import { useNavigation, useNavigationState, useRoute } from "@react-navigation/native";
import { Icon } from "@ummahlibrary/ui";
import { Pressable, StyleSheet } from "../Type";
import { useTheme } from "../theme";
import { useI18n, useIntl } from "../i18n/I18nProvider";
import { localeDir } from "../i18n/config";

/** True when the interface language reads right to left (Arabic, Urdu). */
export function useIsRtl(): boolean {
  const { locale } = useI18n();
  return localeDir(locale) === "rtl";
}

/**
 * Back button for right-to-left headers: on the right, arrow pointing right.
 * Shown only when this screen is not the first in its stack, matching the
 * native back button it replaces. The system back gesture and Android back
 * key keep working as before.
 */
export function RtlBackButton() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  const { t } = useIntl();
  const canGoBack = useNavigationState(
    (s) => (s?.routes.findIndex((r) => r.key === route.key) ?? 0) > 0,
  );
  if (!canGoBack) return null;
  return (
    <Pressable
      onPress={() => navigation.goBack()}
      style={styles.back}
      accessibilityRole="button"
      accessibilityLabel={t("rd.back")}
      hitSlop={8}
    >
      <Icon name="chevR" size={24} color={colors.accent} sw={2.2} />
    </Pressable>
  );
}

/**
 * Native stack headers are drawn by the OS and only mirror with an app-wide
 * `I18nManager` switch, which needs an app restart. Instead, in Arabic and
 * Urdu the header mirrors itself (ADR 0041): the title is centred, the
 * native back button is hidden and a right-pointing back button sits on the
 * right. A screen with its own header action uses `headerSides` so the
 * action moves to the left.
 */
export function useRtlHeaderOptions(): {
  headerTitleAlign?: "center";
  headerBackVisible?: boolean;
  headerRight?: () => ReactNode;
} {
  const rtl = useIsRtl();
  return rtl
    ? { headerTitleAlign: "center", headerBackVisible: false, headerRight: () => <RtlBackButton /> }
    : {};
}

/** Places a screen's own header action on the reading-end side. */
export function headerSides(
  rtl: boolean,
  action: (() => ReactNode) | undefined,
): { headerLeft?: () => ReactNode; headerRight?: () => ReactNode } {
  // Explicit undefined: setOptions merges, so a left action set while the
  // interface was RTL must be cleared when the reader switches back.
  if (!rtl) return { headerLeft: undefined, headerRight: action };
  return { headerLeft: action, headerRight: () => <RtlBackButton /> };
}

const styles = StyleSheet.create({
  back: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
});
