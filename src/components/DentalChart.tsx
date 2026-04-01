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
import { TOOTH_POSITIONS } from "../toothPositions";
import { useAppTheme } from "../theme";
import { useTranslation } from "react-i18next";

const IMAGE_ASPECT = 399 / 600;
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
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const imgWidth = Math.min(width, 500);
  const imgHeight = imgWidth / IMAGE_ASPECT;

  const defaultW = (imgWidth * TOUCH_SIZE_PCT) / 100;
  const defaultH = (imgHeight * TOUCH_SIZE_PCT) / 100;
  const numFontSize = Math.max(9, imgWidth * 0.024);

  return (
    <View style={[styles.container, { width: imgWidth, height: imgHeight }]}>
      <Image
        source={require("../../assets/teeth-chart.png")}
        style={{ width: imgWidth, height: imgHeight }}
        resizeMode="contain"
      />
      <Text
        style={[
          styles.helpText,
          { top: imgHeight * 0.48, right: 10, color: colors.text },
        ]}
      >
        {t("chart.sideLeft")}
      </Text>
      <Text
        style={[
          styles.helpText,
          { top: imgHeight * 0.48, left: 10, color: colors.text },
        ]}
      >
        {t("chart.sideRight")}
      </Text>

      {TOOTH_POSITIONS.map(
        ({ id, x, y, nx, ny, w, h, r, rtl, rtr, rbl, rbr }) => {
          const tw = w != null ? (imgWidth * w) / 100 : defaultW;
          const th = h != null ? (imgHeight * h) / 100 : defaultH;
          const defR = r != null ? (imgWidth * r) / 100 : tw / 2;
          const radius = {
            borderTopLeftRadius: rtl != null ? (imgWidth * rtl) / 100 : defR,
            borderTopRightRadius: rtr != null ? (imgWidth * rtr) / 100 : defR,
            borderBottomLeftRadius: rbl != null ? (imgWidth * rbl) / 100 : defR,
            borderBottomRightRadius:
              rbr != null ? (imgWidth * rbr) / 100 : defR,
          };

          const left = (imgWidth * x) / 100 - tw / 2;
          const top = (imgHeight * y) / 100 - th / 2;
          const status = teethStatuses?.[id];
          const bgColor =
            status && statusColors ? statusColors[status] : undefined;
          const borderColor =
            status && statusBorderColors
              ? statusBorderColors[status]
              : undefined;

          const numLeft = (imgWidth * nx) / 100;
          const numTop = (imgHeight * ny) / 100;

          return (
            <React.Fragment key={id}>
              <Text
                style={[
                  styles.toothNum,
                  {
                    left: numLeft,
                    top: numTop,
                    fontSize: numFontSize,
                    color: colors.text,
                  },
                ]}
                pointerEvents="none"
              >
                {id}
              </Text>
              <Pressable
                onPress={() => onToothLongPress?.(id)}
                onLongPress={() => onToothPress(id)}
                delayLongPress={150}
                style={({ pressed }) => [
                  styles.touchArea,
                  {
                    left,
                    top,
                    width: tw,
                    height: th,
                    ...radius,
                  },
                  bgColor != null && {
                    backgroundColor: bgColor,
                    borderWidth: 2,
                    borderColor,
                  },
                  pressed && styles.pressed,
                ]}
              />
            </React.Fragment>
          );
        },
      )}
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
    fontWeight: "bold",
  },
  toothNum: {
    position: "absolute",
    fontWeight: "600",
    textAlign: "center",
  },
});
