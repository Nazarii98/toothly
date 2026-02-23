import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from "react-native";
import { BlurView } from "expo-blur";
import { useAppTheme } from "../theme";

type Props = {
  visible: boolean;
  onClose: () => void;
  position?: "center" | "bottom";
  animationType?: "fade" | "slide";
  cardStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export function GlassModal({
  visible,
  onClose,
  position = "center",
  animationType = "fade",
  cardStyle,
  children,
}: Props) {
  const { colors } = useAppTheme();
  const isBottom = position === "bottom";

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onClose}
    >
      <Pressable
        style={[
          styles.backdrop,
          { backgroundColor: colors.overlay },
          isBottom && styles.backdropBottom,
        ]}
        onPress={onClose}
      >
        <BlurView
          intensity={80}
          tint={colors.isDark ? "dark" : "light"}
          style={[
            styles.card,
            {
              backgroundColor: colors.glassCard,
              shadowColor: colors.shadow,
            },
            isBottom ? styles.cardBottom : styles.cardCenter,
            cardStyle,
          ]}
          onStartShouldSetResponder={() => true}
        >
          {children}
        </BlurView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  backdropBottom: {
    justifyContent: "flex-end",
    padding: 0,
  },
  card: {
    overflow: "hidden",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  cardCenter: {
    borderRadius: 32,
    width: "100%",
    maxWidth: 360,
  },
  cardBottom: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    width: "100%",
    padding: 24,
    paddingBottom: 40,
  },
});
