import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";
import { ThemeProvider, useAppTheme } from "../src/theme";

function GradientHeader({ isDark }: { isDark: boolean }) {
  const base = isDark ? "15, 26, 21" : "45, 90, 74";
  return (
    <LinearGradient
      colors={[
        `rgba(${base}, 1)`,
        `rgba(${base}, 0.92)`,
        `rgba(${base}, 0.8)`,
        `rgba(${base}, 0.7)`,
        `rgba(${base}, 0.6)`,
        `rgba(${base}, 0.5)`,
      ]}
      locations={[0, 0.25, 0.5, 0.7, 0.88, 1]}
      style={[
        StyleSheet.absoluteFill,
        {
          borderBottomWidth: 1,
          borderBottomColor: isDark
            ? "rgba(42, 61, 52, 0.4)"
            : "rgba(90, 122, 106, 0.29)",
        },
      ]}
    />
  );
}

const modalScreenOptions = (colors: any) => ({
  presentation: "modal" as const,
  headerTransparent: false,
  headerBackground: undefined,
  headerStyle: {
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  } as any,
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: "600" as const, fontSize: 18 },
});

function RootStack() {
  const { colors } = useAppTheme();
  const headerOptions = {
    headerTransparent: true,
    headerTintColor: "#fff",
    headerTitleStyle: { fontWeight: "600" as const, fontSize: 18, flex: 1 },
    headerBackground: () => <GradientHeader isDark={colors.isDark} />,
  };
  return (
    <>
      <StatusBar style={colors.isDark ? "light" : "auto"} />
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
            ...modalScreenOptions(colors),
            title: "Новий запис",
          }}
        />
        <Stack.Screen
          name="edit-record"
          options={{
            ...modalScreenOptions(colors),
            title: "Редагувати запис",
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootStack />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
