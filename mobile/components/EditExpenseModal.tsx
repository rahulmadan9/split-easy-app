import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import { Calendar, Check } from "lucide-react-native";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Badge } from "@/components/Badge";
import { categories } from "../../shared/constants/categories";
import { colors } from "@/lib/colors";
import type { Expense, ExpenseInsert } from "@/hooks/useGroupExpenses";
import type { GroupMember } from "@/hooks/useGroupMembers";
import type {
  SplitType,
  ExpenseCategory,
  ExpenseParticipant,
} from "../../shared/types/firebase";

const formatINR = (amount: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const splitTypeOptions: { value: SplitType; label: string }[] = [
  { value: "equal", label: "Equal" },
  { value: "custom", label: "Custom" },
  { value: "one_owes_all", label: "Full Owed" },
];

interface EditExpenseModalProps {
  visible: boolean;
  expense: Expense | null;
  members: GroupMember[];
  currentUserId: string | undefined;
  onSave: (expenseId: string, data: Partial<ExpenseInsert>) => Promise<void>;
  onClose: () => void;
}

export function EditExpenseModal({
  visible,
  expense,
  members,
  currentUserId,
  onSave,
  onClose,
}: EditExpenseModalProps) {
  const [amountInput, setAmountInput] = useState("");
  const [description, setDescription] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [category, setCategory] = useState<ExpenseCategory>("other");
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [notes, setNotes] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize form when expense changes
  useEffect(() => {
    if (expense) {
      setAmountInput(expense.amount.toString());
      setDescription(expense.description);
      setPaidBy(expense.paid_by);
      setSplitType(expense.split_type);
      setSelectedParticipants(expense.participants.map((p) => p.userId));
      setCategory(expense.category as ExpenseCategory);
      setExpenseDate(new Date(expense.expense_date));
      setNotes(expense.notes || "");

      if (expense.split_type === "custom") {
        const amounts: Record<string, string> = {};
        expense.participants.forEach((p) => {
          amounts[p.userId] = p.amount.toString();
        });
        setCustomAmounts(amounts);
      } else {
        setCustomAmounts({});
      }
    }
  }, [expense]);

  const isSettlement = expense?.is_settlement || expense?.is_payment;
  const amount = parseFloat(amountInput) || 0;

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(false);
    if (date) setExpenseDate(date);
  };

  const buildParticipants = useCallback((): ExpenseParticipant[] => {
    if (splitType === "equal") {
      const perPerson = amount / selectedParticipants.length;
      return selectedParticipants.map((uid) => {
        const member = members.find((m) => m.userId === uid);
        return {
          userId: uid,
          userName: member?.userName || "",
          amount: Math.round(perPerson * 100) / 100,
        };
      });
    }

    if (splitType === "custom") {
      return selectedParticipants.map((uid) => {
        const member = members.find((m) => m.userId === uid);
        return {
          userId: uid,
          userName: member?.userName || "",
          amount: parseFloat(customAmounts[uid] || "0"),
        };
      });
    }

    // one_owes_all
    return selectedParticipants.map((uid) => {
      const member = members.find((m) => m.userId === uid);
      return {
        userId: uid,
        userName: member?.userName || "",
        amount: uid === paidBy ? 0 : amount,
      };
    });
  }, [splitType, amount, selectedParticipants, members, customAmounts, paidBy]);

  const handleSave = async () => {
    if (!expense) return;

    if (!amount || amount <= 0) {
      Toast.show({ type: "error", text1: "Invalid Amount", text2: "Please enter a valid amount" });
      return;
    }
    if (!description.trim()) {
      Toast.show({ type: "error", text1: "Missing Description", text2: "Please enter a description" });
      return;
    }
    if (selectedParticipants.length === 0) {
      Toast.show({ type: "error", text1: "No Participants", text2: "Select at least one participant" });
      return;
    }
    if (splitType === "custom") {
      const totalCustom = selectedParticipants.reduce(
        (sum, uid) => sum + (parseFloat(customAmounts[uid] || "0")),
        0
      );
      if (Math.abs(totalCustom - amount) > 0.01) {
        Toast.show({
          type: "error",
          text1: "Amount Mismatch",
          text2: `Custom amounts total ${formatINR(totalCustom)} but expense is ${formatINR(amount)}`,
        });
        return;
      }
    }

    setSaving(true);
    try {
      const participants = buildParticipants();
      await onSave(expense.id, {
        amount,
        description: description.trim(),
        paid_by: paidBy,
        split_type: splitType,
        participants,
        category,
        expense_date: expenseDate.toISOString().split("T")[0],
        notes: notes.trim() || null,
      });
      Toast.show({ type: "success", text1: "Updated", text2: description.trim() });
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update";
      Toast.show({ type: "error", text1: "Error", text2: message });
    } finally {
      setSaving(false);
    }
  };

  if (!expense) return null;

  // Read-only view for settlements
  if (isSettlement) {
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
              <Text className="text-base text-primary font-medium">Close</Text>
            </Pressable>
            <Text className="text-lg font-semibold text-foreground">Settlement</Text>
            <View className="w-14" />
          </View>
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-lg font-semibold text-foreground mb-2">
              {expense.description}
            </Text>
            <Text className="text-3xl font-bold text-foreground mb-4">
              {formatINR(expense.amount)}
            </Text>
            <Text className="text-sm text-muted-foreground text-center">
              Settlements cannot be edited. To change this, delete and recreate it.
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

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
          <Text className="text-lg font-semibold text-foreground">Edit Expense</Text>
          <View className="w-14" />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            className="flex-1 px-4 pt-4"
            contentContainerStyle={{ paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Amount */}
            <Input
              label="Amount"
              placeholder="0"
              keyboardType="decimal-pad"
              value={amountInput}
              onChangeText={setAmountInput}
              className="mb-4"
            />

            {/* Description */}
            <Input
              label="Description"
              placeholder="What was the expense for?"
              value={description}
              onChangeText={setDescription}
              className="mb-4"
            />

            {/* Paid By */}
            <Text className="text-sm font-medium text-foreground mb-2">Paid by</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              {members.map((member) => (
                <Pressable
                  key={member.userId}
                  onPress={() => setPaidBy(member.userId)}
                  className={`px-4 py-2 rounded-full mr-2 ${
                    paidBy === member.userId ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      paidBy === member.userId
                        ? "text-primary-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {member.userId === currentUserId ? "You" : member.userName}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Split Type */}
            <Text className="text-sm font-medium text-foreground mb-2">Split type</Text>
            <View className="flex-row gap-2 mb-4">
              {splitTypeOptions.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setSplitType(option.value)}
                  className={`flex-1 py-2 rounded-lg items-center border ${
                    splitType === option.value
                      ? "bg-primary border-primary"
                      : "bg-card border-border"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      splitType === option.value
                        ? "text-primary-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Participants */}
            <Text className="text-sm font-medium text-foreground mb-2">
              Split with ({selectedParticipants.length})
            </Text>
            <View className="gap-2 mb-4">
              {members.map((member) => {
                const isSelected = selectedParticipants.includes(member.userId);
                const perPerson =
                  splitType === "equal" && selectedParticipants.length > 0
                    ? amount / selectedParticipants.length
                    : 0;

                return (
                  <View key={member.userId}>
                    <Pressable
                      onPress={() => toggleParticipant(member.userId)}
                      className={`flex-row items-center justify-between p-3 rounded-lg border ${
                        isSelected
                          ? "bg-primary/10 border-primary"
                          : "bg-card border-border"
                      }`}
                    >
                      <View className="flex-row items-center gap-3 flex-1">
                        <View
                          className={`w-8 h-8 rounded-full items-center justify-center ${
                            isSelected ? "bg-primary" : "bg-muted"
                          }`}
                        >
                          <Text
                            className={`font-semibold text-xs ${
                              isSelected
                                ? "text-primary-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {member.userName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-medium text-foreground">
                            {member.userName}
                            {member.userId === currentUserId ? " (You)" : ""}
                          </Text>
                          {splitType === "equal" && isSelected && amount > 0 && (
                            <Text className="text-xs text-muted-foreground">
                              {formatINR(perPerson)}
                            </Text>
                          )}
                        </View>
                      </View>
                      {isSelected && (
                        <View className="w-6 h-6 bg-primary rounded-full items-center justify-center">
                          <Check size={14} color={colors.primaryForeground} />
                        </View>
                      )}
                    </Pressable>

                    {splitType === "custom" && isSelected && (
                      <View className="mt-1 ml-11">
                        <Input
                          placeholder="Amount"
                          keyboardType="decimal-pad"
                          value={customAmounts[member.userId] || ""}
                          onChangeText={(text) =>
                            setCustomAmounts((prev) => ({
                              ...prev,
                              [member.userId]: text,
                            }))
                          }
                          className="py-2 text-sm"
                        />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {splitType === "custom" && amount > 0 && (
              <View className="mb-4 p-2 bg-muted rounded-lg">
                <Text className="text-xs text-muted-foreground text-center">
                  Total:{" "}
                  {formatINR(
                    selectedParticipants.reduce(
                      (sum, uid) => sum + (parseFloat(customAmounts[uid] || "0")),
                      0
                    )
                  )}{" "}
                  / {formatINR(amount)}
                </Text>
              </View>
            )}

            {/* Category */}
            <Text className="text-sm font-medium text-foreground mb-2">Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              {categories.map((cat) => (
                <Pressable
                  key={cat.value}
                  onPress={() => setCategory(cat.value)}
                  className={`px-4 py-2 rounded-full mr-2 ${
                    category === cat.value ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      category === cat.value
                        ? "text-primary-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Date */}
            <Text className="text-sm font-medium text-foreground mb-2">Date</Text>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              className="bg-card border border-border rounded-lg px-4 py-3 flex-row items-center gap-3 mb-4"
            >
              <Calendar size={18} color={colors.mutedForeground} />
              <Text className="text-base text-foreground">
                {expenseDate.toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={expenseDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}

            {/* Notes */}
            <Input
              label="Notes (optional)"
              placeholder="Add any additional notes..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              className="min-h-[80px] text-start mb-6"
            />

            {/* Save */}
            <Button
              onPress={handleSave}
              loading={saving}
              disabled={saving || !amount || !description.trim()}
              size="lg"
              className="w-full"
            >
              Save Changes
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
