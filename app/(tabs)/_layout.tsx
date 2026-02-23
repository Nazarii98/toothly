import {
  NativeTabs,
  Icon,
  Label,
  VectorIcon,
} from "expo-router/unstable-native-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAppTheme } from "../../src/theme";

export default function TabLayout() {
  const { colors } = useAppTheme();
  return (
    <NativeTabs
      tintColor={colors.accent}
      blurEffect={colors.isDark ? "systemMaterialDark" : "systemMaterial"}
    >
      <NativeTabs.Trigger name="index">
        <Icon
          sf={{
            default: "rectangle.grid.2x2",
            selected: "rectangle.grid.2x2.fill",
          }}
          androidSrc={<VectorIcon family={Ionicons} name="grid" />}
        />
        <Label>Схема зубів</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="history">
        <Icon
          sf={{ default: "calendar", selected: "calendar" }}
          androidSrc={<VectorIcon family={Ionicons} name="calendar" />}
        />
        <Label>Історія</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <Icon
          sf={{ default: "gearshape", selected: "gearshape.fill" }}
          androidSrc={<VectorIcon family={Ionicons} name="settings" />}
        />
        <Label>Налаштування</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
