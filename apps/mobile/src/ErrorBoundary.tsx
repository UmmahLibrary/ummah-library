/**
 * Last-resort crash barrier (no equivalent existed anywhere in the app).
 * Without this, any uncaught render error — in any screen, any provider,
 * triggered by malformed persisted/synced data that slipped past a store's
 * own read-time validation (ADR 0028's guards are read-time, not a
 * guarantee every consumer handles every shape correctly) — blanks the
 * whole app with no recovery path.
 *
 * Deliberately uses raw `react-native` primitives and hardcoded colors
 * instead of this app's own `Type`/theme layer: whatever crashed could in
 * principle be *inside* that layer, so the fallback stays independent of
 * everything it exists to catch failures in.
 */
import { Component, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error("Uncaught render error:", error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            The app hit an unexpected error. Your data stays on this device either way —
            tap below to try again.
          </Text>
          <Pressable style={styles.button} onPress={this.reset} accessibilityRole="button">
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    backgroundColor: "#0a0b0f",
  },
  title: { fontSize: 20, fontWeight: "700", color: "#f2f2f2", marginBottom: 10, textAlign: "center" },
  message: {
    fontSize: 14,
    color: "#b7b7b7",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
    maxWidth: 320,
  },
  button: { backgroundColor: "#e6b855", paddingVertical: 13, paddingHorizontal: 28, borderRadius: 10 },
  buttonText: { color: "#1a1404", fontWeight: "700", fontSize: 15 },
});
