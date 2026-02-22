import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from "react-native";
import { BlurView } from "expo-blur";

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
  const isBottom = position === "bottom";

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.backdrop, isBottom && styles.backdropBottom]}
        onPress={onClose}
      >
        <BlurView
          intensity={80}
          tint="light"
          style={[
            styles.card,
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
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: 24,
  },
  backdropBottom: {
    justifyContent: "flex-end",
    padding: 0,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.65)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  cardCenter: {
    borderRadius: 20,
    width: "100%",
    maxWidth: 360,
  },
  cardBottom: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: "100%",
    padding: 24,
    paddingBottom: 40,
  },
});
