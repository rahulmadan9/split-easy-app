import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { Swipeable } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import {
  Trash2,
  Receipt,
  ArrowRightLeft,
  TrendingUp,
} from "lucide-react-native";
import { Card } from "@/components/Card";
import { MonthSelector } from "@/components/MonthSelector";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/Badge";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentGroup } from "@/hooks/useCurrentGroup";
import { useGroupExpenses, type Expense } from "@/hooks/useGroupExpenses";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import { categories } from "../../shared/constants/categories";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const formatINR = (amount: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

export default function ExpensesScreen() {
  const { user } = useAuth();
  const { currentGroupId } = useCurrentGroup();
  const { expenses, loading } = useGroupExpenses(currentGroupId);
  const { members } = useGroupMembers(currentGroupId);

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => e.expense_date.startsWith(selectedMonth));
  }, [expenses, selectedMonth]);

  const monthSummary = useMemo(() => {
    const total = filteredExpenses.reduce((sum, e) => {
      if (e.is_settlement) return sum;
      return sum + e.amount;
    }, 0);

    const youPaid = filteredExpenses.reduce((sum, e) => {
      if (e.is_settlement) return sum;
      if (e.paid_by === user?.uid) return sum + e.amount;
      return sum;
    }, 0);

    const othersPaid = total - youPaid;

    return { total, youPaid, othersPaid };
  }, [filteredExpenses, user]);

  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      if (e.is_settlement) return;
      breakdown[e.category] = (breakdown[e.category] || 0) + e.amount;
    });

    return Object.entries(breakdown)
      .map(([cat, amount]) => ({
        category: cat,
        label:
          categories.find((c) => c.value === cat)?.label || cat,
        amount,
        percentage:
          monthSummary.total > 0
            ? (amount / monthSummary.total) * 100
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, monthSummary]);

  const handleDeleteExpense = useCallback(
    (expense: Expense) => {
      Alert.alert(
        "Delete Expense",
        `Delete "${expense.description}" (${formatINR(expense.amount)})?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteDoc(doc(db, "expenses", expense.id));
                Toast.show({
                  type: "success",
                  text1: "Deleted",
                  text2: expense.description,
                });
              } catch (error) {
                const message =
                  error instanceof Error
                    ? error.message
                    : "Failed to delete expense";
                Toast.show({
                  type: "error",
                  text1: "Error",
                  text2: message,
                });
              }
            },
          },
        ]
      );
    },
    []
  );

  const renderRightActions = useCallback(
    (expense: Expense) => (
      <Pressable
        onPress={() => handleDeleteExpense(expense)}
        className="bg-destructive justify-center items-center px-6 rounded-r-2xl"
      >
        <Trash2 size={22} color="#ffffff" />
        <Text className="text-white text-xs font-medium mt-1">Delete</Text>
      </Pressable>
    ),
    [handleDeleteExpense]
  );

  const renderExpenseItem = useCallback(
    ({ item, index }: { item: Expense; index: number }) => {
      const isSettlement = item.is_settlement;
      const paidByYou = item.paid_by === user?.uid;
      const categoryLabel =
        categories.find((c) => c.value === item.category)?.label || "Other";

      return (
        <Animated.View entering={FadeInDown.delay(index * 40).duration(300)}>
          <Swipeable renderRightActions={() => renderRightActions(item)}>
            <View className="bg-card border border-border rounded-2xl p-4 mx-4 mb-2">
              <View className="flex-row items-start justify-between">
                <View className="flex-row items-center gap-3 flex-1">
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center ${
                      isSettlement ? "bg-green-100" : "bg-primary/10"
                    }`}
                  >
                    {isSettlement ? (
                      <ArrowRightLeft size={18} color="#22c55e" />
                    ) : (
                      <Receipt size={18} color="#6366f1" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-base font-semibold text-foreground"
                      numberOfLines={1}
                    >
                      {item.description}
                    </Text>
                    <View className="flex-row items-center gap-2 mt-0.5">
                      <Text className="text-sm text-muted-foreground">
                        {paidByYou ? "You" : item.paid_by_name}
                      </Text>
                      {!isSettlement && (
                        <Badge variant="outline">{categoryLabel}</Badge>
                      )}
                    </View>
                    <Text className="text-xs text-muted-foreground mt-0.5">
                      {new Date(item.expense_date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </Text>
                  </View>
                </View>
                <Text
                  className={`text-lg font-bold ${
                    paidByYou ? "text-positive" : "text-foreground"
                  }`}
                >
                  {formatINR(item.amount)}
                </Text>
              </View>
            </View>
          </Swipeable>
        </Animated.View>
      );
    },
    [user, renderRightActions]
  );

  const ListHeader = useMemo(
    () => (
      <>
        {/* Month Summary */}
        <Animated.View entering={FadeIn.duration(400)} className="px-4 mb-4">
          <Card className="p-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-muted-foreground">
                Total Expenses
              </Text>
              <Text className="text-lg font-bold text-foreground">
                {formatINR(monthSummary.total)}
              </Text>
            </View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-sm text-muted-foreground">You paid</Text>
              <Text className="text-sm font-semibold text-positive">
                {formatINR(monthSummary.youPaid)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted-foreground">Others paid</Text>
              <Text className="text-sm font-semibold text-foreground">
                {formatINR(monthSummary.othersPaid)}
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* Category Breakdown */}
        {categoryBreakdown.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            className="px-4 mb-4"
          >
            <Text className="text-base font-semibold text-foreground mb-3">
              By Category
            </Text>
            <Card className="p-4">
              {categoryBreakdown.map((cat, idx) => (
                <View
                  key={cat.category}
                  className={`${idx > 0 ? "mt-3" : ""}`}
                >
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-sm text-foreground font-medium">
                      {cat.label}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      {formatINR(cat.amount)} ({Math.round(cat.percentage)}%)
                    </Text>
                  </View>
                  <View className="h-2 bg-muted rounded-full overflow-hidden">
                    <View
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </View>
                </View>
              ))}
            </Card>
          </Animated.View>
        )}

        {/* Expenses Header */}
        <View className="px-4 mb-2">
          <Text className="text-base font-semibold text-foreground">
            Transactions ({filteredExpenses.length})
          </Text>
        </View>
      </>
    ),
    [monthSummary, categoryBreakdown, filteredExpenses.length]
  );

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["left", "right"]}>
      {/* Month Selector */}
      <Animated.View entering={FadeIn.duration(300)} className="pt-2">
        <MonthSelector
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />
      </Animated.View>

      {filteredExpenses.length === 0 ? (
        <View className="flex-1">
          {ListHeader}
          <EmptyState
            icon={Receipt}
            title="No expenses this month"
            description="Add an expense to see it here"
          />
        </View>
      ) : (
        <FlatList
          data={filteredExpenses}
          keyExtractor={(item) => item.id}
          renderItem={renderExpenseItem}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
