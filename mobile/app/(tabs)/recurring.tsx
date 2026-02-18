import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import Toast from "react-native-toast-message";
import {
  Repeat,
  CheckCircle,
  Clock,
  Plus,
  Trash2,
  RotateCcw,
  Edit3,
} from "lucide-react-native";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { EditRecurringModal } from "@/components/EditRecurringModal";
import { BulkConfirmModal } from "@/components/BulkConfirmModal";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentGroup } from "@/hooks/useCurrentGroup";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import { useRecurringExpenses } from "@/hooks/useRecurringExpenses";
import type {
  RecurringItemWithStatus,
  RecurringExpenseInsert,
} from "@/hooks/useRecurringExpenses";
import { categories } from "../../../shared/constants/categories";
import { colors } from "@/lib/colors";
import type { ExpenseCategory, SplitType } from "../../../shared/types/firebase";

const formatINR = (amount: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

function getMonthDisplay(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export default function RecurringScreen() {
  const { user } = useAuth();
  const { currentGroupId } = useCurrentGroup();
  const { members } = useGroupMembers(currentGroupId);
  const {
    loading,
    monthKey,
    pendingItems,
    confirmedItems,
    summary,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    confirmRecurringExpense,
    bulkConfirm,
    undoConfirmation,
  } = useRecurringExpenses(currentGroupId);

  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmAmount, setConfirmAmount] = useState("");
  const [editingItem, setEditingItem] = useState<RecurringItemWithStatus | null>(null);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  // Add form state
  const [newDescription, setNewDescription] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState<ExpenseCategory>("utilities");
  const [addingRecurring, setAddingRecurring] = useState(false);

  const handleAddRecurring = async () => {
    if (!newDescription.trim() || !newAmount) {
      Toast.show({
        type: "error",
        text1: "Missing Fields",
        text2: "Please enter a description and amount",
      });
      return;
    }

    setAddingRecurring(true);
    try {
      const participants = members.map((m) => ({
        userId: m.userId,
        userName: m.userName,
        amount: parseFloat(newAmount) / members.length,
      }));

      await addRecurringExpense({
        description: newDescription.trim(),
        defaultAmount: parseFloat(newAmount),
        category: newCategory,
        expenseType: "shared",
        splitType: "equal" as SplitType,
        participants,
        typicallyPaidBy: user?.uid || members[0]?.userId || "",
      });

      Toast.show({
        type: "success",
        text1: "Recurring Expense Added",
        text2: newDescription.trim(),
      });

      setNewDescription("");
      setNewAmount("");
      setNewCategory("utilities");
      setShowAddModal(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add recurring expense";
      Toast.show({ type: "error", text1: "Error", text2: message });
    } finally {
      setAddingRecurring(false);
    }
  };

  const handleConfirm = async (item: RecurringItemWithStatus) => {
    const amount = parseFloat(confirmAmount) || item.defaultAmount;
    setConfirmingId(item.id);
    try {
      await confirmRecurringExpense(item.id, amount);
      Toast.show({
        type: "success",
        text1: "Confirmed",
        text2: `${item.description} - ${formatINR(amount)}`,
      });
      setConfirmAmount("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to confirm";
      Toast.show({ type: "error", text1: "Error", text2: message });
    } finally {
      setConfirmingId(null);
    }
  };

  const handleUndo = async (item: RecurringItemWithStatus) => {
    if (!item.confirmation) return;

    Alert.alert("Undo Confirmation", `Undo confirmation for ${item.description}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Undo",
        style: "destructive",
        onPress: async () => {
          try {
            await undoConfirmation(item.confirmation!.id);
            Toast.show({
              type: "success",
              text1: "Undone",
              text2: `${item.description} moved back to pending`,
            });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Failed to undo";
            Toast.show({ type: "error", text1: "Error", text2: message });
          }
        },
      },
    ]);
  };

  const handleDelete = (item: RecurringItemWithStatus) => {
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
              await deleteRecurringExpense(item.id);
              Toast.show({
                type: "success",
                text1: "Deleted",
                text2: item.description,
              });
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Failed to delete";
              Toast.show({ type: "error", text1: "Error", text2: message });
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
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
        {/* Month Header */}
        <Animated.View entering={FadeIn.duration(500)} className="px-4 pt-4">
          <Text className="text-xl font-bold text-foreground">
            {getMonthDisplay(monthKey)}
          </Text>
        </Animated.View>

        {/* Summary Cards */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          className="px-4 mt-4 flex-row gap-2"
        >
          <Card className="flex-1 px-2 py-3 items-center overflow-hidden">
            <Text
              className="text-xs text-muted-foreground mb-1 w-full text-center"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              Total Fixed
            </Text>
            <Text
              className="text-sm font-bold text-foreground w-full text-center"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {formatINR(summary.totalFixed)}
            </Text>
          </Card>

          <Card className="flex-1 px-2 py-3 items-center overflow-hidden">
            <Text
              className="text-xs text-muted-foreground mb-1 w-full text-center"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              Paid So Far
            </Text>
            <Text
              className="text-sm font-bold text-positive w-full text-center"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {formatINR(summary.paidSoFar)}
            </Text>
          </Card>

          <Card className="flex-1 px-2 py-3 items-center overflow-hidden">
            <Text
              className="text-xs text-muted-foreground mb-1 w-full text-center"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              Remaining
            </Text>
            <Text
              className="text-sm font-bold text-negative w-full text-center"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {formatINR(summary.remaining)}
            </Text>
          </Card>
        </Animated.View>

        {/* Pending Items */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          className="px-4 mt-6"
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Clock size={18} color={colors.warning} />
              <Text className="text-lg font-semibold text-foreground">
                Pending ({pendingItems.length})
              </Text>
            </View>
            {pendingItems.length > 1 && (
              <Pressable
                onPress={() => setShowBulkConfirm(true)}
                className="px-3 py-1.5 bg-primary rounded-lg"
              >
                <Text className="text-xs font-semibold text-primary-foreground">
                  Confirm All
                </Text>
              </Pressable>
            )}
          </View>

          {pendingItems.length === 0 ? (
            <Card className="p-4 items-center">
              <Text className="text-sm text-muted-foreground">
                All items confirmed for this month
              </Text>
            </Card>
          ) : (
            <View className="gap-3">
              {pendingItems.map((item, index) => {
                const categoryLabel =
                  categories.find((c) => c.value === item.category)?.label ||
                  "Other";
                const isConfirming = confirmingId === item.id;

                return (
                  <Animated.View
                    key={item.id}
                    entering={FadeInDown.delay(250 + index * 60).duration(400)}
                  >
                    <Card className="p-4">
                      <View className="flex-row items-start justify-between mb-2">
                        <View className="flex-1">
                          <Text className="text-base font-semibold text-foreground">
                            {item.description}
                          </Text>
                          <View className="flex-row items-center gap-2 mt-1">
                            <Badge variant="outline">{categoryLabel}</Badge>
                            <Text className="text-sm text-muted-foreground">
                              Paid by {item.typicallyPaidByName}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-lg font-bold text-foreground">
                          {formatINR(item.defaultAmount)}
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-2 mt-2">
                        <View className="flex-1">
                          <Input
                            placeholder={item.defaultAmount.toString()}
                            keyboardType="decimal-pad"
                            value={
                              confirmingId === item.id ? confirmAmount : ""
                            }
                            onChangeText={
                              confirmingId === item.id
                                ? setConfirmAmount
                                : () => {
                                    setConfirmingId(item.id);
                                    setConfirmAmount("");
                                  }
                            }
                            onFocus={() => {
                              setConfirmingId(item.id);
                              setConfirmAmount("");
                            }}
                            className="py-2 text-sm"
                          />
                        </View>
                        <Button
                          onPress={() => handleConfirm(item)}
                          size="sm"
                          loading={isConfirming && confirmingId === item.id}
                        >
                          Confirm
                        </Button>
                        <Pressable
                          onPress={() => setEditingItem(item)}
                          className="p-2"
                        >
                          <Edit3 size={18} color={colors.primary} />
                        </Pressable>
                        <Pressable
                          onPress={() => handleDelete(item)}
                          className="p-2"
                        >
                          <Trash2 size={18} color={colors.destructive} />
                        </Pressable>
                      </View>
                    </Card>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </Animated.View>

        {/* Confirmed Items */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(500)}
          className="px-4 mt-6"
        >
          <View className="flex-row items-center gap-2 mb-3">
            <CheckCircle size={18} color={colors.positive} />
            <Text className="text-lg font-semibold text-foreground">
              Confirmed ({confirmedItems.length})
            </Text>
          </View>

          {confirmedItems.length === 0 ? (
            <Card className="p-4 items-center">
              <Text className="text-sm text-muted-foreground">
                No items confirmed yet
              </Text>
            </Card>
          ) : (
            <View className="gap-3">
              {confirmedItems.map((item, index) => (
                <Animated.View
                  key={item.id}
                  entering={FadeInDown.delay(350 + index * 60).duration(400)}
                >
                  <Card className="p-4 bg-green-50 border-green-200">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-foreground">
                          {item.description}
                        </Text>
                        <Text className="text-sm text-muted-foreground mt-1">
                          Confirmed by {item.confirmation?.confirmedByName} -{" "}
                          {formatINR(item.confirmation?.confirmedAmount || 0)}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <Pressable
                          onPress={() => setEditingItem(item)}
                          className="p-2"
                        >
                          <Edit3 size={18} color={colors.primary} />
                        </Pressable>
                        <Pressable
                          onPress={() => handleUndo(item)}
                          className="p-2"
                        >
                          <RotateCcw size={18} color={colors.primary} />
                        </Pressable>
                      </View>
                    </View>
                  </Card>
                </Animated.View>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Add Button */}
        <View className="px-4 mt-6">
          <Button
            onPress={() => setShowAddModal(true)}
            variant="outline"
            size="lg"
            className="w-full"
          >
            <View className="flex-row items-center gap-2">
              <Plus size={20} color={colors.foreground} />
              <Text className="text-base font-semibold text-foreground">
                Add Recurring Expense
              </Text>
            </View>
          </Button>
        </View>
      </ScrollView>

      {/* Add Recurring Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
            <Pressable onPress={() => setShowAddModal(false)}>
              <Text className="text-base text-primary font-medium">Cancel</Text>
            </Pressable>
            <Text className="text-lg font-semibold text-foreground">
              Add Recurring
            </Text>
            <View className="w-14" />
          </View>

          <ScrollView
            className="flex-1 px-4 pt-4"
            keyboardShouldPersistTaps="handled"
          >
            <Input
              label="Description"
              placeholder="e.g., Electricity Bill"
              value={newDescription}
              onChangeText={setNewDescription}
              className="mb-4"
            />

            <Input
              label="Default Amount"
              placeholder="0"
              keyboardType="decimal-pad"
              value={newAmount}
              onChangeText={setNewAmount}
              className="mb-4"
            />

            <Text className="text-sm font-medium text-foreground mb-2">
              Category
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-6"
            >
              {categories.map((cat) => (
                <Pressable
                  key={cat.value}
                  onPress={() => setNewCategory(cat.value)}
                  className={`px-4 py-2 rounded-full mr-2 ${
                    newCategory === cat.value ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      newCategory === cat.value
                        ? "text-primary-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Button
              onPress={handleAddRecurring}
              loading={addingRecurring}
              disabled={!newDescription.trim() || !newAmount}
              size="lg"
              className="w-full"
            >
              Add Recurring Expense
            </Button>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit Recurring Modal */}
      <EditRecurringModal
        visible={!!editingItem}
        item={editingItem}
        members={members}
        currentUserId={user?.uid}
        onSave={updateRecurringExpense}
        onDelete={deleteRecurringExpense}
        onClose={() => setEditingItem(null)}
      />

      {/* Bulk Confirm Modal */}
      <BulkConfirmModal
        visible={showBulkConfirm}
        pendingItems={pendingItems}
        onConfirm={bulkConfirm}
        onClose={() => setShowBulkConfirm(false)}
      />
    </SafeAreaView>
  );
}
