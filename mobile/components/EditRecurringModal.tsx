import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { categories } from "../../shared/constants/categories";
import type { RecurringItemWithStatus, RecurringExpenseInsert } from "@/hooks/useRecurringExpenses";
import type { GroupMember } from "@/hooks/useGroupMembers";
import type {
  SplitType,
  ExpenseCategory,
  RecurringExpenseType,
} from "../../shared/types/firebase";

interface EditRecurringModalProps {
  visible: boolean;
  item: RecurringItemWithStatus | null;
  members: GroupMember[];
  currentUserId: string | undefined;
  onSave: (id: string, data: Partial<RecurringExpenseInsert>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

export function EditRecurringModal({
  visible,
  item,
  members,
  currentUserId,
  onSave,
  onDelete,
  onClose,
}: EditRecurringModalProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseType, setExpenseType] = useState<RecurringExpenseType>("shared");
  const [category, setCategory] = useState<ExpenseCategory>("utilities");
  const [paidBy, setPaidBy] = useState("");
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setDescription(item.description);
      setAmount(item.defaultAmount.toString());
      setExpenseType(item.expenseType);
      setCategory(item.category);
      setPaidBy(item.typicallyPaidBy);
      setSplitType(item.splitType);
    }
  }, [item]);

  const handleSave = async () => {
    if (!item) return;

    if (!description.trim()) {
      Toast.show({ type: "error", text1: "Missing Description" });
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Toast.show({ type: "error", text1: "Invalid Amount" });
      return;
    }

    setSaving(true);
    try {
      const participants = members.map((m) => ({
        userId: m.userId,
        userName: m.userName,
        amount: parseFloat(amount) / members.length,
      }));

      await onSave(item.id, {
        description: description.trim(),
        defaultAmount: parseFloat(amount),
        category,
        expenseType,
        splitType: expenseType === "shared" ? splitType : "equal",
        participants,
        typicallyPaidBy: paidBy,
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

  const handleDelete = () => {
    if (!item) return;
    Alert.alert(
      "Delete Recurring Expense",
      `Delete "${item.description}"? This will not remove already confirmed expenses.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await onDelete(item.id);
              Toast.show({ type: "success", text1: "Deleted", text2: item.description });
              onClose();
            } catch (error) {
              const message = error instanceof Error ? error.message : "Failed to delete";
              Toast.show({ type: "error", text1: "Error", text2: message });
            }
          },
        },
      ]
    );
  };

  if (!item) return null;

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
          <Text className="text-lg font-semibold text-foreground">Edit Recurring</Text>
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
            <Input
              label="Description"
              placeholder="e.g., Electricity Bill"
              value={description}
              onChangeText={setDescription}
              className="mb-4"
            />

            <Input
              label="Default Amount"
              placeholder="0"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              className="mb-4"
            />

            {/* Expense Type */}
            <Text className="text-sm font-medium text-foreground mb-2">Type</Text>
            <View className="flex-row gap-2 mb-4">
              {(["shared", "personal"] as RecurringExpenseType[]).map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setExpenseType(type)}
                  className={`flex-1 py-2 rounded-lg items-center border ${
                    expenseType === type
                      ? "bg-primary border-primary"
                      : "bg-card border-border"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium capitalize ${
                      expenseType === type
                        ? "text-primary-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>

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

            {/* Paid By */}
            <Text className="text-sm font-medium text-foreground mb-2">Typically paid by</Text>
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

            {/* Split Type (only for shared) */}
            {expenseType === "shared" && (
              <>
                <Text className="text-sm font-medium text-foreground mb-2">Split type</Text>
                <View className="flex-row gap-2 mb-6">
                  {(["equal", "one_owes_all"] as SplitType[]).map((type) => (
                    <Pressable
                      key={type}
                      onPress={() => setSplitType(type)}
                      className={`flex-1 py-2 rounded-lg items-center border ${
                        splitType === type
                          ? "bg-primary border-primary"
                          : "bg-card border-border"
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          splitType === type
                            ? "text-primary-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {type === "equal" ? "Equal" : "Full Owed"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            <Button
              onPress={handleSave}
              loading={saving}
              disabled={saving || !description.trim() || !amount}
              size="lg"
              className="w-full mb-4"
            >
              Save Changes
            </Button>

            <Button
              onPress={handleDelete}
              variant="destructive"
              size="lg"
              className="w-full"
            >
              Delete Recurring Expense
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
