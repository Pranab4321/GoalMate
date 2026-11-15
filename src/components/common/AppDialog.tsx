import React, { ReactNode } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
} from "lucide-react-native";

import AppButton from "@/components/common/AppButton";
import { useTheme } from "@/hooks/use-theme";
import { Radius, Spacing, Typography } from "@/theme";

type DialogVariant = "info" | "success" | "warning" | "error" | "confirmation";

interface AppDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  variant?: DialogVariant;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  onDismiss?: () => void;
  loading?: boolean;
  children?: ReactNode;
}

export default function AppDialog({
  visible,
  title,
  message,
  variant = "info",
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  onDismiss,
  loading = false,
  children,
}: AppDialogProps) {
  const colors = useTheme();

  const variantConfig = {
    info: {
      Icon: Info,
      color: colors.primary,
      background: colors.surfaceSecondary,
      confirmVariant: "primary" as const,
    },
    success: {
      Icon: CheckCircle2,
      color: colors.success,
      background: colors.successLight,
      confirmVariant: "primary" as const,
    },
    warning: {
      Icon: TriangleAlert,
      color: colors.warning,
      background: colors.warningLight,
      confirmVariant: "primary" as const,
    },
    error: {
      Icon: AlertCircle,
      color: colors.danger,
      background: colors.dangerLight,
      confirmVariant: "danger" as const,
    },
    confirmation: {
      Icon: Info,
      color: colors.primary,
      background: colors.surfaceSecondary,
      confirmVariant: "primary" as const,
    },
  }[variant];

  const { Icon } = variantConfig;

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
      return;
    }

    onDismiss?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss ?? handleCancel}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close dialog"
          style={StyleSheet.absoluteFill}
          onPress={onDismiss ?? handleCancel}
        />

        <View
          accessibilityViewIsModal
          style={[
            styles.dialog,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: variantConfig.background },
            ]}
          >
            <Icon size={27} color={variantConfig.color} strokeWidth={2.2} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            {title}
          </Text>

          {message ? (
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {message}
            </Text>
          ) : null}

          {children ? <View style={styles.children}>{children}</View> : null}

          <View style={styles.actions}>
            {onCancel ? (
              <View style={styles.button}>
                <AppButton
                  title={cancelText}
                  onPress={handleCancel}
                  variant="outline"
                  fullWidth
                  disabled={loading}
                />
              </View>
            ) : null}

            <View style={styles.button}>
              <AppButton
                title={confirmText}
                onPress={onConfirm}
                variant={variantConfig.confirmVariant}
                fullWidth
                loading={loading}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  dialog: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: Radius["2xl"],
    padding: Spacing.xl,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  iconContainer: {
    width: 58,
    height: 58,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    lineHeight: 27,
    fontWeight: Typography.fontWeight.bold,
    textAlign: "center",
  },
  message: {
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.lineHeight.relaxed,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  children: {
    width: "100%",
    marginTop: Spacing.lg,
  },
  actions: {
    width: "100%",
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  button: {
    flex: 1,
  },
});
