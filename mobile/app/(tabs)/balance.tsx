import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import Toast from "react-native-toast-message";
import {
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  ArrowRight,
  Wallet,
} from "lucide-react-native";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentGroup } from "@/hooks/useCurrentGroup";
import { useGroupBalance } from "@/hooks/useGroupBalance";
import { useGroupExpenses } from "@/hooks/useGroupExpenses";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import type { SimplifiedDebt } from "../../../shared/types/firebase";

const formatINR = (amount: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

export default function BalanceScreen() {
  const { user } = useAuth();
  const { currentGroupId } = useCurrentGroup();
  const { myBalance, settlements, loading } = useGroupBalance(currentGroupId);
  const { addExpense } = useGroupExpenses(currentGroupId);
  const { members } = useGroupMembers(currentGroupId);
  const [recordingPayment, setRecordingPayment] = useState<string | null>(null);

  const handleRecordPayment = async (settlement: SimplifiedDebt) => {
    Alert.alert(
      "Record Payment",
      `Record ${formatINR(settlement.amount)} payment from ${settlement.fromName} to ${settlement.toName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Record",
          onPress: async () => {
            setRecordingPayment(
              `${settlement.from}-${settlement.to}`
            );
            try {
              const participants = [
                {
                  userId: settlement.from,
                  userName: settlement.fromName,
                  amount: settlement.amount,
                },
                {
                  userId: settlement.to,
                  userName: settlement.toName,
                  amount: 0,
                },
              ];

              await addExpense({
                groupId: currentGroupId!,
                amount: settlement.amount,
                description: `Payment: ${settlement.fromName} to ${settlement.toName}`,
                paid_by: settlement.from,
                split_type: "custom",
                participants,
                is_settlement: true,
                is_payment: true,
                category: "other",
                expense_date: new Date().toISOString().split("T")[0],
              });

              Toast.show({
                type: "success",
                text1: "Payment Recorded",
                text2: `${formatINR(settlement.amount)} from ${settlement.fromName} to ${settlement.toName}`,
              });
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : "Failed to record payment";
              Toast.show({
                type: "error",
                text1: "Error",
                text2: message,
              });
            } finally {
              setRecordingPayment(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["left", "right"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Summary */}
        <Animated.View entering={FadeIn.duration(500)} className="px-4 pt-4">
          <Card
            className={`p-6 items-center ${
              myBalance > 0
                ? "bg-green-50 border-green-200"
                : myBalance < 0
                ? "bg-red-50 border-red-200"
                : "bg-card"
            }`}
          >
            <View className="w-16 h-16 rounded-full items-center justify-center mb-3 bg-card">
              {myBalance > 0 ? (
                <ArrowUpRight size={32} color="#22c55e" />
              ) : myBalance < 0 ? (
                <ArrowDownLeft size={32} color="#ef4444" />
              ) : (
                <CheckCircle size={32} color="#22c55e" />
              )}
            </View>

            <Text className="text-sm font-medium text-muted-foreground mb-1">
              {myBalance > 0
                ? "You are owed"
                : myBalance < 0
                ? "You owe"
                : "All settled!"}
            </Text>

            <Text
              className={`text-4xl font-bold ${
                myBalance > 0
                  ? "text-positive"
                  : myBalance < 0
                  ? "text-negative"
                  : "text-foreground"
              }`}
            >
              {formatINR(Math.abs(myBalance))}
            </Text>
          </Card>
        </Animated.View>

        {/* Settlement Suggestions */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          className="px-4 mt-6"
        >
          <Text className="text-lg font-semibold text-foreground mb-3">
            Settlement Suggestions
          </Text>

          {settlements.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No settlements needed"
              description="Everyone is settled up in this group"
            />
          ) : (
            <View className="gap-3">
              {settlements.map((settlement, index) => {
                const isFromMe = settlement.from === user?.uid;
                const isToMe = settlement.to === user?.uid;
                const paymentKey = `${settlement.from}-${settlement.to}`;
                const isRecording = recordingPayment === paymentKey;

                return (
                  <Animated.View
                    key={paymentKey}
                    entering={FadeInDown.delay(250 + index * 80).duration(400)}
                  >
                    <Card className="p-4">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3 flex-1">
                          <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center">
                            <Text className="text-primary font-bold text-base">
                              {settlement.fromName.charAt(0).toUpperCase()}
                            </Text>
                          </View>

                          <View className="flex-1">
                            <View className="flex-row items-center gap-2">
                              <Text
                                className="text-sm font-semibold text-foreground"
                                numberOfLines={1}
                              >
                                {isFromMe ? "You" : settlement.fromName}
                              </Text>
                              <ArrowRight size={14} color="#94a3b8" />
                              <Text
                                className="text-sm font-semibold text-foreground"
                                numberOfLines={1}
                              >
                                {isToMe ? "You" : settlement.toName}
                              </Text>
                            </View>
                            <Text
                              className={`text-lg font-bold mt-0.5 ${
                                isFromMe ? "text-negative" : "text-positive"
                              }`}
                            >
                              {formatINR(settlement.amount)}
                            </Text>
                          </View>
                        </View>

                        <Button
                          onPress={() => handleRecordPayment(settlement)}
                          variant="outline"
                          size="sm"
                          loading={isRecording}
                          disabled={isRecording}
                        >
                          Record
                        </Button>
                      </View>
                    </Card>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
