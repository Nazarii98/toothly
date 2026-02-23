import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, ActivityIndicator, View } from "react-native";
import { ThemeProvider, useAppTheme } from "../src/theme";
import { AuthProvider, useAuth } from "../src/AuthProvider";
import { DataSyncProvider } from "../src/DataSyncProvider";

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

function GradientHeader({
  bg,
  borderColor,
}: {
  bg: string;
  borderColor: string;
}) {
  const base = hexToRgb(bg);
  return (
    <LinearGradient
      colors={[
        `rgba(${base}, 1)`,
        `rgba(${base}, 0.92)`,
        `rgba(${base}, 0.85)`,
        `rgba(${base}, 0.7)`,
        `rgba(${base}, 0.45)`,
        `rgba(${base}, 0)`,
      ]}
      locations={[0, 0.2, 0.4, 0.6, 0.8, 1]}
      style={[
        StyleSheet.absoluteFill,
        {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: borderColor,
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
    headerBackground: () => (
      <GradientHeader bg={colors.bg} borderColor={colors.border} />
    ),
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
