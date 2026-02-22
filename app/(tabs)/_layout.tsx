import {
  NativeTabs,
  Icon,
  Label,
  VectorIcon,
} from "expo-router/unstable-native-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function TabLayout() {
  return (
    <NativeTabs tintColor="#2d5a4a" blurEffect="systemMaterial">
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
          sf={{ default: "clock", selected: "clock.fill" }}
          androidSrc={<VectorIcon family={Ionicons} name="time" />}
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
