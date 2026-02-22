import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlassModal } from "./GlassModal";
import type { ToothStatus, StatusMaps } from "../types";

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  currentStatus?: ToothStatus;
  statusMaps: StatusMaps;
  onSelect: (status: ToothStatus) => void;
  footer?: React.ReactNode;
};

export function StatusPickerModal({
  visible,
  onClose,
  title,
  currentStatus,
  statusMaps,
  onSelect,
  footer,
}: Props) {
  const options: [string, string][] = [
    ["", "Не встановлено"],
    ...statusMaps.options,
  ];

  return (
    <GlassModal visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.done}>Готово</Text>
        </Pressable>
      </View>
      <View style={styles.list}>
        {options.map(([value, label]) => {
          const isSelected = (currentStatus ?? "") === value;
          const color =
            value === "" ? "#999" : (statusMaps.borderColors[value] ?? "#999");
          return (
            <Pressable
              key={value || "empty"}
              style={({ pressed }) => [
                styles.option,
                isSelected && styles.optionSelected,
                pressed && styles.optionPressed,
              ]}
              onPress={() => onSelect(value as ToothStatus)}
            >
              <View style={[styles.dot, { backgroundColor: color }]} />
              <Text
                style={[styles.label, isSelected && styles.labelSelected]}
              >
                {label}
              </Text>
              {isSelected && (
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color="#2d5a4a"
                  style={styles.check}
                />
              )}
            </Pressable>
          );
        })}
      </View>
      {footer}
    </GlassModal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e8ece8",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a3d32",
    flex: 1,
    marginRight: 12,
  },
  done: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d5a4a",
  },
  list: {
    padding: 12,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 12,
  },
  optionSelected: {
    backgroundColor: "#e8f5ee",
  },
  optionPressed: {
    backgroundColor: "#f0f5f2",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  label: {
    flex: 1,
    fontSize: 16,
    color: "#3d5a4a",
  },
  labelSelected: {
    fontWeight: "600",
    color: "#1a3d32",
  },
  check: {
    marginLeft: "auto",
  },
});
