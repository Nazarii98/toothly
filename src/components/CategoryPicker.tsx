import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useAppTheme } from "../theme";

export interface CategoryOption {
  value: string;
  label: string;
  color?: string;
}

interface Props {
  title: string;
  options: CategoryOption[];
  selected: string;
  onSelect: (value: string) => void;
}

export function CategoryPicker({ title, options, selected, onSelect }: Props) {
  const { colors } = useAppTheme();

  return (
    <View>
      <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
      <View style={styles.grid}>
        {options.map(({ value, label, color }) => {
          const active = selected === value;
          const dotColor = color ?? colors.accent;
          return (
            <Pressable
              key={value}
              onPress={() => onSelect(value)}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: active ? colors.accent : colors.accentBg,
                  borderColor: active ? colors.accent : "transparent",
                },
                pressed && !active && { backgroundColor: colors.statusOptionBg },
              ]}
            >
              <View
                style={[
                  styles.dot,
                  { backgroundColor: active ? colors.white : dotColor },
                ]}
              />
              <Text
                style={[
                  styles.label,
                  { color: active ? colors.white : colors.text },
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
});
