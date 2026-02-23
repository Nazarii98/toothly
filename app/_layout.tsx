import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, ActivityIndicator, View } from "react-native";
import { ThemeProvider, useAppTheme } from "../src/theme";
import { AuthProvider, useAuth } from "../src/AuthProvider";
import { DataSyncProvider } from "../src/DataSyncProvider";

function GradientHeader({ isDark }: { isDark: boolean }) {
  const darkBase = "15, 26, 21";
  return (
    <LinearGradient
      colors={
        isDark
          ? [
              `rgba(${darkBase}, 1)`,
              `rgba(${darkBase}, 0.92)`,
              `rgba(${darkBase}, 0.8)`,
              `rgba(${darkBase}, 0.7)`,
              `rgba(${darkBase}, 0.6)`,
              `rgba(${darkBase}, 0.5)`,
            ]
          : [
              "rgba(230, 232, 234, 0.95)",
              "rgba(232, 234, 236, 0.88)",
              "rgba(236, 238, 240, 0.75)",
              "rgba(240, 241, 243, 0.55)",
              "rgba(244, 245, 246, 0.3)",
              "rgba(248, 248, 249, 0)",
            ]
      }
      locations={[0, 0.2, 0.45, 0.65, 0.85, 1]}
      style={[
        StyleSheet.absoluteFill,
        {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: isDark
            ? "rgba(42, 61, 52, 0.4)"
            : "rgba(0, 0, 0, 0.12)",
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
  const { user, loading } = useAuth();
  const headerOptions = {
    headerTransparent: true,
    headerTintColor: colors.text,
    headerBackButtonDisplayMode: "minimal" as const,
    headerTitleStyle: { fontWeight: "700" as const, fontSize: 24, flex: 1 },
    headerBackground: () => <GradientHeader isDark={colors.isDark} />,
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.bg,
        }}
      >
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={colors.isDark ? "light" : "auto"} />
      <Stack screenOptions={headerOptions}>
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, title: "Home" }}
          redirect={!user}
        />
        <Stack.Screen name="tooth/[id]" redirect={!user} />
        <Stack.Screen
          name="procedures"
          options={{ title: "Глобальні процедури" }}
          redirect={!user}
        />
        <Stack.Screen
          name="statuses"
          options={{ title: "Керування статусами" }}
          redirect={!user}
        />
        <Stack.Screen
          name="profiles"
          options={{ title: "Профіль" }}
          redirect={!user}
        />
        <Stack.Screen
          name="global-detail"
          options={{ title: "Ротова порожнина" }}
          redirect={!user}
        />
        <Stack.Screen
          name="history-list"
          options={{ title: "Історія" }}
          redirect={!user}
        />
        <Stack.Screen
          name="profile-access"
          options={{ title: "Доступ до профілю" }}
          redirect={!user}
        />
        <Stack.Screen
          name="login"
          options={{ headerShown: false }}
          redirect={!!user}
        />
        <Stack.Screen
          name="register"
          options={{ headerShown: false }}
          redirect={!!user}
        />
        <Stack.Screen
          name="add-record"
          options={{ ...modalScreenOptions(colors), title: "Новий запис" }}
          redirect={!user}
        />
        <Stack.Screen
          name="edit-record"
          options={{ ...modalScreenOptions(colors), title: "Редагувати запис" }}
          redirect={!user}
        />
        <Stack.Screen
          name="edit-global"
          options={{
            ...modalScreenOptions(colors),
            title: "Редагувати процедуру",
          }}
          redirect={!user}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <DataSyncProvider>
            <RootStack />
          </DataSyncProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
