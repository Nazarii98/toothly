import React from "react";
import {
  View,
  Image,
  StyleSheet,
  useWindowDimensions,
  Pressable,
  Text,
} from "react-native";
import type { ToothId, ToothStatus } from "../types";

const IMAGE_ASPECT = 399 / 600;

const TOOTH_POSITIONS: { id: ToothId; x: number; y: number }[] = [
  // Верхня щелепа — ліва сторона (права пацієнта, квадрант 1: 18→11)
  { id: "18", x: 19.5, y: 42 },
  { id: "17", x: 19.5, y: 36 },
  { id: "16", x: 21, y: 30 },
  { id: "15", x: 24.5, y: 24 },
  { id: "14", x: 28.5, y: 19.0 },
  { id: "13", x: 32.5, y: 14.5 },
  { id: "12", x: 37.5, y: 10.5 },
  { id: "11", x: 45.5, y: 8.5 },

  // Верхня щелепа — права сторона (ліва пацієнта, квадрант 2: 21→28)
  { id: "21", x: 55, y: 8.5 },
  { id: "22", x: 63.5, y: 10.5 },
  { id: "23", x: 69, y: 14.5 },
  { id: "24", x: 72.5, y: 19.5 },
  { id: "25", x: 76.5, y: 24.5 },
  { id: "26", x: 79.5, y: 30 },
  { id: "27", x: 81.5, y: 36 },
  { id: "28", x: 80.5, y: 42.5 },

  // Нижня щелепа — ліва сторона (права пацієнта, квадрант 4: 48→41)
  { id: "48", x: 19.5, y: 58.5 },
  { id: "47", x: 19, y: 65 },
  { id: "46", x: 21, y: 72 },
  { id: "45", x: 25.5, y: 78 },
  { id: "44", x: 30.5, y: 83.5 },
  { id: "43", x: 35.5, y: 87.5 },
  { id: "42", x: 40, y: 90 },
  { id: "41", x: 46.5, y: 90.5 },

  // Нижня щелепа — права сторона (ліва пацієнта, квадрант 3: 31→38)
  { id: "31", x: 53, y: 90.5 },
  { id: "32", x: 59, y: 90 },
  { id: "33", x: 64.5, y: 87.5 },
  { id: "34", x: 69.5, y: 83 },
  { id: "35", x: 74.5, y: 77.5 },
  { id: "36", x: 79, y: 71.5 },
  { id: "37", x: 81, y: 65 },
  { id: "38", x: 81, y: 59 },
];

const TOUCH_SIZE_PCT = 8;

type Props = {
  onToothPress: (toothId: ToothId) => void;
  onToothLongPress?: (toothId: ToothId) => void;
  teethStatuses?: Record<ToothId, ToothStatus | undefined>;
  statusColors?: Record<string, string>;
  statusBorderColors?: Record<string, string>;
};

export function DentalChart({
  onToothPress,
  onToothLongPress,
  teethStatuses,
  statusColors,
  statusBorderColors,
}: Props) {
  const { width } = useWindowDimensions();
  const imgWidth = Math.min(width, 500);
  const imgHeight = imgWidth / IMAGE_ASPECT;

  const touchSize = (imgWidth * TOUCH_SIZE_PCT) / 100;
  const half = touchSize / 2;

  return (
    <View style={[styles.container, { width: imgWidth, height: imgHeight }]}>
      <Image
        source={require("../../assets/teeth-chart.png")}
        style={{ width: imgWidth, height: imgHeight }}
        resizeMode="contain"
      />
      <Text style={[styles.helpText, { top: imgHeight * 0.48, right: 10 }]}>
        Ліва
      </Text>
      <Text style={[styles.helpText, { top: imgHeight * 0.48, left: 10 }]}>
        Права
      </Text>
      {TOOTH_POSITIONS.map(({ id, x, y }) => {
        const left = (imgWidth * x) / 100 - half;
        const top = (imgHeight * y) / 100 - half;
        const status = teethStatuses?.[id];
        const bgColor =
          status && statusColors ? statusColors[status] : undefined;
        const borderColor =
          status && statusBorderColors ? statusBorderColors[status] : undefined;

        return (
          <Pressable
            key={id}
            onPress={() => onToothPress(id)}
            onLongPress={() => onToothLongPress?.(id)}
            delayLongPress={150}
            style={({ pressed }) => [
              styles.touchArea,
              {
                left,
                top,
                width: touchSize,
                height: touchSize,
                borderRadius: touchSize / 2,
              },
              bgColor != null && {
                backgroundColor: bgColor,
                borderWidth: 2,
                borderColor,
              },
              pressed && styles.pressed,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignSelf: "center",
  },
  touchArea: {
    position: "absolute",
    backgroundColor: "transparent",
  },
  pressed: {
    opacity: 0.65,
  },
  helpText: {
    position: "absolute",
    fontSize: 20,
    color: "#008000",
    fontWeight: "bold",
  },
});
