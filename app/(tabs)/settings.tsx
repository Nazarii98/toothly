import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.content}>
        <Text style={styles.title}>Налаштування</Text>
        <View style={styles.card}>
          <Pressable
            style={styles.menuRow}
            onPress={() => router.push("/profiles")}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="person" size={22} color="#2d5a4a" />
            </View>
            <Text style={styles.menuLabel}>Профіль</Text>
            <Ionicons name="chevron-forward" size={20} color="#8a9a90" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f2f6f4" },
  content: { padding: 20 },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a3d32",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#1a3d32",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#eef5f1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: "#1a3d32",
  },
});
