import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";

function GradientHeader() {
  return (
    <LinearGradient
      colors={[
        "rgba(45, 90, 74, 1)",
        "rgba(45, 90, 74, 0.92)",
        "rgba(45, 90, 74, 0.8)",
        "rgba(45, 90, 74, 0.7)",
        "rgba(45, 90, 74, 0.6)",
        "rgba(45, 90, 74, 0.5)",
      ]}
      locations={[0, 0.25, 0.5, 0.7, 0.88, 1]}
      style={[
        StyleSheet.absoluteFill,
        { borderBottomWidth: 1, borderBottomColor: "#5a7a6a49" },
      ]}
    />
  );
}

const headerOptions = {
  headerTransparent: true,
  headerTintColor: "#fff",
  headerTitleStyle: { fontWeight: "600" as const, fontSize: 18, flex: 1 },
  headerBackground: () => <GradientHeader />,
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={headerOptions}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="tooth/[id]"
          options={{ headerBackTitle: "Назад" }}
        />
        <Stack.Screen
          name="procedures"
          options={{ title: "Глобальні процедури" }}
        />
        <Stack.Screen
          name="statuses"
          options={{ title: "Керування статусами" }}
        />
        <Stack.Screen
          name="profiles"
          options={{ title: "Профіль", headerBackTitle: "Назад" }}
        />
        <Stack.Screen
          name="add-record"
          options={{
            presentation: "modal",
            title: "Новий запис",
            headerTransparent: false,
            headerBackground: undefined,
            headerStyle: {
              backgroundColor: "#f2f6f4",
              borderBottomWidth: 1,
              borderBottomColor: "#dce5df",
            } as any,
            headerTintColor: "#1a3d32",
            headerTitleStyle: { fontWeight: "600" as const, fontSize: 18 },
          }}
        />
        <Stack.Screen
          name="edit-record"
          options={{
            presentation: "modal",
            title: "Редагувати запис",
            headerTransparent: false,
            headerBackground: undefined,
            headerStyle: {
              backgroundColor: "#f2f6f4",
              borderBottomWidth: 1,
              borderBottomColor: "#dce5df",
            } as any,
            headerTintColor: "#1a3d32",
            headerTitleStyle: { fontWeight: "600" as const, fontSize: 18 },
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
