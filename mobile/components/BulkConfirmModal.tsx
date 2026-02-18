import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import type { RecurringItemWithStatus } from "@/hooks/useRecurringExpenses";

const formatINR = (amount: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

interface BulkConfirmModalProps {
  visible: boolean;
  pendingItems: RecurringItemWithStatus[];
  onConfirm: (items: { recurringExpenseId: string; amount: number }[]) => Promise<void>;
  onClose: () => void;
}

export function BulkConfirmModal({
  visible,
  pendingItems,
  onConfirm,
  onClose,
}: BulkConfirmModalProps) {
  const [confirming, setConfirming] = useState(false);

  const total = pendingItems.reduce((sum, item) => sum + item.defaultAmount, 0);

  const handleConfirmAll = async () => {
    setConfirming(true);
    try {
      const items = pendingItems.map((item) => ({
        recurringExpenseId: item.id,
        amount: item.defaultAmount,
      }));
      await onConfirm(items);
      Toast.show({
        type: "success",
        text1: "All Confirmed",
        text2: `${pendingItems.length} items confirmed`,
      });
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to confirm";
      Toast.show({ type: "error", text1: "Error", text2: message });
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <Pressable onPress={onClose}>
            <Text className="text-base text-primary font-medium">Cancel</Text>
          </Pressable>
          <Text className="text-lg font-semibold text-foreground">Confirm All</Text>
          <View className="w-14" />
        </View>

        <ScrollView
          className="flex-1 px-4 pt-4"
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <Text className="text-sm text-muted-foreground mb-3">
            The following items will be confirmed with their default amounts:
          </Text>

          <View className="gap-2 mb-4">
            {pendingItems.map((item) => (
              <Card key={item.id} className="p-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-medium text-foreground">
                      {item.description}
                    </Text>
                    <Text className="text-sm text-muted-foreground mt-0.5">
                      Paid by {item.typicallyPaidByName}
                    </Text>
                  </View>
                  <Text className="text-base font-bold text-foreground">
                    {formatINR(item.defaultAmount)}
                  </Text>
                </View>
              </Card>
            ))}
          </View>

          {/* Total */}
          <Card className="p-4 mb-6">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold text-foreground">Total</Text>
              <Text className="text-xl font-bold text-foreground">
                {formatINR(total)}
              </Text>
            </View>
          </Card>

          <Button
            onPress={handleConfirmAll}
            loading={confirming}
            disabled={confirming}
            size="lg"
            className="w-full"
          >
            Confirm All ({pendingItems.length} items)
          </Button>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
