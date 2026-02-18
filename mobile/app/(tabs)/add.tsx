import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import Toast from "react-native-toast-message";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  Tag,
  StickyNote,
  Check,
  Zap,
} from "lucide-react-native";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { BottomSheet } from "@/components/BottomSheet";
import { Badge } from "@/components/Badge";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentGroup } from "@/hooks/useCurrentGroup";
import { useGroupExpenses } from "@/hooks/useGroupExpenses";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import { useSmartDefaults } from "@/hooks/useSmartDefaults";
import { calculateAmount } from "../../../shared/lib/amountCalculator";
import { categories } from "../../../shared/constants/categories";
import type {
  SplitType,
  ExpenseCategory,
  ExpenseParticipant,
} from "../../../shared/types/firebase";

const formatINR = (amount: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const splitTypeOptions: { value: SplitType; label: string; desc: string }[] = [
  { value: "equal", label: "Equal", desc: "Split equally among participants" },
  { value: "custom", label: "Custom", desc: "Set custom amounts per person" },
  {
    value: "one_owes_all",
    label: "Full Amount Owed",
    desc: "One person owes the full amount",
  },
];

export default function AddExpenseScreen() {
  const { user } = useAuth();
  const { currentGroupId } = useCurrentGroup();
  const { addExpense } = useGroupExpenses(currentGroupId);
  const { members, loading: membersLoading } = useGroupMembers(currentGroupId);
  const {
    lastSplitType,
    setLastSplitType,
    smartCategorize,
    getSuggestion,
    recordExpense,
    recordCategoryCorrection,
  } = useSmartDefaults();

  // Form state
  const [amountInput, setAmountInput] = useState("");
  const [description, setDescription] = useState("");
  const [paidBy, setPaidBy] = useState<string>("");
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [category, setCategory] = useState<ExpenseCategory>("other");
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [notes, setNotes] = useState("");
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Bottom sheet states
  const [showPaidBySheet, setShowPaidBySheet] = useState(false);
  const [showSplitTypeSheet, setShowSplitTypeSheet] = useState(false);
  const [showCategorySheet, setShowCategorySheet] = useState(false);

  // Smart suggestion
  const [suggestion, setSuggestion] = useState<{
    description: string;
    amount: number;
    category: ExpenseCategory;
  } | null>(null);

  // Initialize defaults
  useEffect(() => {
    if (members.length > 0 && !paidBy) {
      setPaidBy(user?.uid || members[0]?.userId || "");
      setSelectedParticipants(members.map((m) => m.userId));
    }
  }, [members, user]);

  useEffect(() => {
    setSplitType(lastSplitType);
  }, [lastSplitType]);

  // Smart categorization on description change
  useEffect(() => {
    if (description.length >= 2) {
      const autoCategory = smartCategorize(description);
      setCategory(autoCategory);

      const match = getSuggestion(description);
      if (match) {
        setSuggestion(match);
      } else {
        setSuggestion(null);
      }
    }
  }, [description, smartCategorize, getSuggestion]);

  const amount = useMemo(() => {
    const calculated = calculateAmount(amountInput);
    return parseFloat(calculated) || 0;
  }, [amountInput]);

  const handleAmountBlur = () => {
    if (amountInput) {
      const calculated = calculateAmount(amountInput);
      if (calculated !== amountInput) {
        setAmountInput(calculated);
      }
    }
  };

  const applySuggestion = () => {
    if (suggestion) {
      setDescription(suggestion.description);
      setAmountInput(suggestion.amount.toString());
      setCategory(suggestion.category);
      setSuggestion(null);
    }
  };

  const paidByMember = members.find((m) => m.userId === paidBy);

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
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

    // one_owes_all: the non-payer owes full amount
    return selectedParticipants.map((uid) => {
      const member = members.find((m) => m.userId === uid);
      const owesAmount = uid === paidBy ? 0 : amount;
      return {
        userId: uid,
        userName: member?.userName || "",
        amount: owesAmount,
      };
    });
  }, [splitType, amount, selectedParticipants, members, customAmounts, paidBy]);

  const handleSubmit = async () => {
    if (!amount || amount <= 0) {
      Toast.show({
        type: "error",
        text1: "Invalid Amount",
        text2: "Please enter a valid amount",
      });
      return;
    }

    if (!description.trim()) {
      Toast.show({
        type: "error",
        text1: "Missing Description",
        text2: "Please enter a description",
      });
      return;
    }

    if (selectedParticipants.length === 0) {
      Toast.show({
        type: "error",
        text1: "No Participants",
        text2: "Please select at least one participant",
      });
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

    setSubmitting(true);
    try {
      const participants = buildParticipants();

      await addExpense({
        groupId: currentGroupId!,
        amount,
        description: description.trim(),
        paid_by: paidBy,
        split_type: splitType,
        participants,
        category,
        expense_date: expenseDate.toISOString().split("T")[0],
        notes: notes.trim() || null,
      });

      setLastSplitType(splitType);
      recordExpense({
        description: description.trim(),
        amount,
        category,
        splitType,
      });
      if (category !== smartCategorize(description)) {
        recordCategoryCorrection(description, category);
      }

      Toast.show({
        type: "success",
        text1: "Expense Added",
        text2: `${formatINR(amount)} for ${description.trim()}`,
      });

      // Reset form
      setAmountInput("");
      setDescription("");
      setNotes("");
      setCategory("other");
      setExpenseDate(new Date());
      setCustomAmounts({});
      setSelectedParticipants(members.map((m) => m.userId));
      setSuggestion(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add expense";
      Toast.show({ type: "error", text1: "Error", text2: message });
    } finally {
      setSubmitting(false);
    }
  };

  if (membersLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const categoryLabel =
    categories.find((c) => c.value === category)?.label || "Other";

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={90}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.duration(400)} className="px-4 pt-4">
            {/* Amount Input */}
            <Card className="p-5 mb-4">
              <Text className="text-sm font-medium text-muted-foreground mb-2">
                Amount
              </Text>
              <View className="flex-row items-center">
                <Text className="text-3xl font-bold text-foreground mr-2">
                  Rs.
                </Text>
                <Input
                  placeholder="0"
                  keyboardType="decimal-pad"
                  value={amountInput}
                  onChangeText={setAmountInput}
                  onBlur={handleAmountBlur}
                  className="flex-1 text-3xl font-bold border-0 p-0"
                />
              </View>
              {amountInput && amountInput !== amount.toString() && (
                <Text className="text-xs text-muted-foreground mt-1">
                  = {formatINR(amount)}
                </Text>
              )}
            </Card>

            {/* Description */}
            <Animated.View entering={FadeInDown.delay(100)}>
              <Input
                label="Description"
                placeholder="What was the expense for?"
                value={description}
                onChangeText={setDescription}
                className="mb-1"
              />

              {/* Smart Suggestion */}
              {suggestion && (
                <Pressable
                  onPress={applySuggestion}
                  className="flex-row items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 mt-1 mb-3"
                >
                  <Zap size={14} color="#6366f1" />
                  <Text className="text-sm text-primary flex-1" numberOfLines={1}>
                    {suggestion.description} - {formatINR(suggestion.amount)}
                  </Text>
                  <Text className="text-xs text-primary font-semibold">
                    Apply
                  </Text>
                </Pressable>
              )}

              {/* Auto Category Badge */}
              {description.length >= 2 && (
                <View className="flex-row items-center gap-2 mt-1 mb-3">
                  <Tag size={12} color="#6366f1" />
                  <Badge variant="default">
                    {categoryLabel}
                  </Badge>
                </View>
              )}
            </Animated.View>

            {/* Paid By */}
            <Animated.View entering={FadeInDown.delay(200)} className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">
                Paid by
              </Text>
              <Pressable
                onPress={() => setShowPaidBySheet(true)}
                className="bg-card border border-border rounded-lg px-4 py-3 flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-8 h-8 bg-primary rounded-full items-center justify-center">
                    <Text className="text-primary-foreground font-semibold text-sm">
                      {paidByMember?.userName?.charAt(0)?.toUpperCase() || "?"}
                    </Text>
                  </View>
                  <Text className="text-base text-foreground">
                    {paidByMember?.userId === user?.uid
                      ? "You"
                      : paidByMember?.userName || "Select"}
                  </Text>
                </View>
                <ChevronDown size={20} color="#94a3b8" />
              </Pressable>
            </Animated.View>

            {/* Split Type */}
            <Animated.View entering={FadeInDown.delay(300)} className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">
                Split type
              </Text>
              <Pressable
                onPress={() => setShowSplitTypeSheet(true)}
                className="bg-card border border-border rounded-lg px-4 py-3 flex-row items-center justify-between"
              >
                <Text className="text-base text-foreground">
                  {splitTypeOptions.find((s) => s.value === splitType)?.label ||
                    "Equal"}
                </Text>
                <ChevronDown size={20} color="#94a3b8" />
              </Pressable>
            </Animated.View>

            {/* Participants */}
            <Animated.View entering={FadeInDown.delay(400)} className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">
                Split with ({selectedParticipants.length} selected)
              </Text>

              <View className="gap-2">
                {members.map((member) => {
                  const isSelected = selectedParticipants.includes(
                    member.userId
                  );
                  const isCurrentUser = member.userId === user?.uid;
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
                            className={`w-9 h-9 rounded-full items-center justify-center ${
                              isSelected ? "bg-primary" : "bg-muted"
                            }`}
                          >
                            <Text
                              className={`font-semibold text-sm ${
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
                              {member.userName}{" "}
                              {isCurrentUser && "(You)"}
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
                            <Check size={14} color="#ffffff" />
                          </View>
                        )}
                      </Pressable>

                      {/* Custom amount input */}
                      {splitType === "custom" && isSelected && (
                        <View className="mt-1 ml-12">
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
                <View className="mt-2 p-2 bg-muted rounded-lg">
                  <Text className="text-xs text-muted-foreground text-center">
                    Total:{" "}
                    {formatINR(
                      selectedParticipants.reduce(
                        (sum, uid) =>
                          sum + (parseFloat(customAmounts[uid] || "0")),
                        0
                      )
                    )}{" "}
                    / {formatINR(amount)}
                  </Text>
                </View>
              )}
            </Animated.View>

            {/* More Options Toggle */}
            <Pressable
              onPress={() => setShowMoreOptions(!showMoreOptions)}
              className="flex-row items-center justify-center gap-2 py-3 mb-2"
            >
              <Text className="text-sm font-medium text-primary">
                More options
              </Text>
              {showMoreOptions ? (
                <ChevronUp size={16} color="#6366f1" />
              ) : (
                <ChevronDown size={16} color="#6366f1" />
              )}
            </Pressable>

            {/* More Options */}
            {showMoreOptions && (
              <Animated.View entering={FadeIn.duration(300)} className="gap-4 mb-4">
                {/* Date */}
                <View>
                  <Text className="text-sm font-medium text-foreground mb-2">
                    Date
                  </Text>
                  <Pressable
                    onPress={() => setShowDatePicker(true)}
                    className="bg-card border border-border rounded-lg px-4 py-3 flex-row items-center gap-3"
                  >
                    <Calendar size={18} color="#64748b" />
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
                </View>

                {/* Category */}
                <View>
                  <Text className="text-sm font-medium text-foreground mb-2">
                    Category
                  </Text>
                  <Pressable
                    onPress={() => setShowCategorySheet(true)}
                    className="bg-card border border-border rounded-lg px-4 py-3 flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center gap-3">
                      <Tag size={18} color="#64748b" />
                      <Text className="text-base text-foreground">
                        {categoryLabel}
                      </Text>
                    </View>
                    <ChevronDown size={20} color="#94a3b8" />
                  </Pressable>
                </View>

                {/* Notes */}
                <Input
                  label="Notes (optional)"
                  placeholder="Add any additional notes..."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  className="min-h-[80px] text-start"
                />
              </Animated.View>
            )}

            {/* Submit */}
            <Button
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting || !amount || !description.trim()}
              size="lg"
              className="w-full mt-4"
            >
              Add Expense
            </Button>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Paid By Bottom Sheet */}
      <BottomSheet
        isOpen={showPaidBySheet}
        onClose={() => setShowPaidBySheet(false)}
        title="Who paid?"
        snapPoints={["50%"]}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {members.map((member) => (
            <Pressable
              key={member.userId}
              onPress={() => {
                setPaidBy(member.userId);
                setShowPaidBySheet(false);
              }}
              className="flex-row items-center justify-between py-4 border-b border-border"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-primary rounded-full items-center justify-center">
                  <Text className="text-primary-foreground font-semibold">
                    {member.userName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text className="text-base text-foreground font-medium">
                  {member.userName}
                  {member.userId === user?.uid ? " (You)" : ""}
                </Text>
              </View>
              {paidBy === member.userId && (
                <Check size={22} color="#6366f1" />
              )}
            </Pressable>
          ))}
        </ScrollView>
      </BottomSheet>

      {/* Split Type Bottom Sheet */}
      <BottomSheet
        isOpen={showSplitTypeSheet}
        onClose={() => setShowSplitTypeSheet(false)}
        title="Split type"
        snapPoints={["40%"]}
      >
        {splitTypeOptions.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => {
              setSplitType(option.value);
              setShowSplitTypeSheet(false);
            }}
            className="flex-row items-center justify-between py-4 border-b border-border"
          >
            <View className="flex-1">
              <Text className="text-base text-foreground font-medium">
                {option.label}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {option.desc}
              </Text>
            </View>
            {splitType === option.value && (
              <Check size={22} color="#6366f1" />
            )}
          </Pressable>
        ))}
      </BottomSheet>

      {/* Category Bottom Sheet */}
      <BottomSheet
        isOpen={showCategorySheet}
        onClose={() => setShowCategorySheet(false)}
        title="Category"
        snapPoints={["50%"]}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {categories.map((cat) => (
            <Pressable
              key={cat.value}
              onPress={() => {
                setCategory(cat.value);
                setShowCategorySheet(false);
              }}
              className="flex-row items-center justify-between py-4 border-b border-border"
            >
              <Text className="text-base text-foreground font-medium">
                {cat.label}
              </Text>
              {category === cat.value && (
                <Check size={22} color="#6366f1" />
              )}
            </Pressable>
          ))}
        </ScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}
