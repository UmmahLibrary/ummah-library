import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ummah Library</Text>
      <Text style={styles.subtitle}>Phase 0 scaffold — hello world.</Text>
      <Text style={styles.footer}>Sadaqah Jariyah · AGPL-3.0</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f0e",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: { color: "#e7efe9", fontSize: 28, fontWeight: "600" },
  subtitle: { color: "#9fb3a6", fontSize: 15, marginTop: 8 },
  footer: { color: "#5b6b61", fontSize: 12, marginTop: 32 },
});
