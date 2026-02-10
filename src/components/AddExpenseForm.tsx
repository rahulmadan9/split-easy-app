import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProfiles } from "@/hooks/useProfiles";
import { useGroupExpenses } from "@/hooks/useGroupExpenses";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import { useSmartDefaults } from "@/hooks/useSmartDefaults";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { calculateAmount } from "@/lib/amountCalculator";
import type { ExpenseParticipant } from "@/integrations/firebase/types";

type ExpenseCategory = "rent" | "utilities" | "groceries" | "household_supplies" | "shared_meals" | "purchases" | "other";
type SplitType = "equal" | "custom" | "one_owes_all";

const categories: { value: ExpenseCategory; label: string }[] = [
  { value: "rent", label: "Rent" },
  { value: "utilities", label: "Utilities" },
  { value: "groceries", label: "Groceries" },
  { value: "household_supplies", label: "Household Supplies" },
  { value: "shared_meals", label: "Shared Meals" },
  { value: "purchases", label: "Purchases" },
  { value: "other", label: "Other" },
];

interface AddExpenseFormProps {
  groupId: string | null;
  onSuccess?: () => void;
}

const AddExpenseForm = ({ groupId, onSuccess }: AddExpenseFormProps) => {
  const { currentProfile } = useProfiles();
  const { addExpense } = useGroupExpenses(groupId);
  const { members } = useGroupMembers(groupId);
  const {
    lastSplitType,
    setLastSplitType,
    recordExpense,
    recordCategoryCorrection,
    smartCategorize,
    getSuggestion,
  } = useSmartDefaults();

  const [showOptional, setShowOptional] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<{
    description: string;
    amount: number;
  } | null>(null);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paidBy, setPaidBy] = useState<string>("");
  const [splitType, setSplitType] = useState<SplitType>(lastSplitType as SplitType);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<Set<string>>(new Set());
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [category, setCategory] = useState<ExpenseCategory | "auto">("auto");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  // Set default payer to current user
  useEffect(() => {
    if (currentProfile && !paidBy) {
      setPaidBy(currentProfile.id);
    }
  }, [currentProfile, paidBy]);

  // Select all members by default
  useEffect(() => {
    if (members.length > 0 && selectedParticipantIds.size === 0) {
      setSelectedParticipantIds(new Set(members.map((m) => m.userId)));
    }
  }, [members]);

  // Smart suggestions based on description
  useEffect(() => {
    const match = getSuggestion(description);
    if (match && match.description.toLowerCase() !== description.toLowerCase()) {
      setSuggestion({ description: match.description, amount: match.amount });
    } else {
      setSuggestion(null);
    }
  }, [description, getSuggestion]);

  // Build participants array based on split type
  const participants = useMemo((): ExpenseParticipant[] => {
    const totalAmount = parseFloat(amount) || 0;
    const participantMembers = members.filter((m) => selectedParticipantIds.has(m.userId));

    if (splitType === "equal") {
      const perPerson = participantMembers.length > 0 ? totalAmount / participantMembers.length : 0;
      return participantMembers.map((m) => ({
        userId: m.userId,
        userName: m.userName,
        amount: Math.round(perPerson * 100) / 100,
      }));
    }

    if (splitType === "custom") {
      return participantMembers.map((m) => ({
        userId: m.userId,
        userName: m.userName,
        amount: parseFloat(customAmounts[m.userId] || "0") || 0,
      }));
    }

    // one_owes_all: everyone except the payer owes equal share
    const owingMembers = participantMembers.filter((m) => m.userId !== paidBy);
    const perPerson = owingMembers.length > 0 ? totalAmount / owingMembers.length : 0;
    return owingMembers.map((m) => ({
      userId: m.userId,
      userName: m.userName,
      amount: Math.round(perPerson * 100) / 100,
    }));
  }, [amount, members, selectedParticipantIds, splitType, customAmounts, paidBy]);

  const toggleParticipant = (userId: string) => {
    setSelectedParticipantIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const resetForm = () => {
    setAmount("");
    setDescription("");
    setPaidBy(currentProfile?.id || "");
    setSelectedParticipantIds(new Set(members.map((m) => m.userId)));
    setCustomAmounts({});
    setCategory("auto");
    setDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setShowOptional(false);
    setSuggestion(null);
  };

  const applySuggestion = () => {
    if (suggestion) {
      setDescription(suggestion.description);
      setAmount(suggestion.amount.toString());
      setSuggestion(null);
    }
  };

  const handleAmountBlur = () => {
    const calculated = calculateAmount(amount);
    if (calculated !== amount) {
      setAmount(calculated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProfile || !groupId) return;

    if (selectedParticipantIds.size === 0) {
      toast.error("Select at least one participant");
      return;
    }

    setLoading(true);

    try {
      const finalCategory =
        category === "auto" ? smartCategorize(description) : category;

      await addExpense({
        groupId,
        description,
        amount: parseFloat(amount),
        paid_by: paidBy,
        split_type: splitType,
        participants,
        category: finalCategory,
        expense_date: date,
        notes: notes || null,
        is_payment: false,
        is_settlement: false,
      });

      setLastSplitType(splitType);
      recordExpense({
        description,
        amount: parseFloat(amount),
        category: finalCategory,
        splitType,
      });

      if (category !== "auto") {
        recordCategoryCorrection(description, category);
      }

      toast.success("Expense added!");
      resetForm();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  const suggestedCategory = smartCategorize(description);

  if (!groupId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Select a group to add expenses
      </div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-5 p-1"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="space-y-2">
        <Label htmlFor="amount" className="text-base">
          Amount
        </Label>
        <Input
          id="amount"
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onBlur={handleAmountBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAmountBlur();
            }
          }}
          required
          className="text-xl h-14 font-medium"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-base">
          Description
        </Label>
        <div className="relative">
          <Input
            id="description"
            type="text"
            placeholder="What was it for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="h-12"
          />
          <AnimatePresence>
            {suggestion && (
              <motion.button
                type="button"
                onClick={applySuggestion}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute left-0 right-0 top-full mt-1 flex items-center gap-2 rounded-lg border border-border bg-accent/50 px-3 py-2 text-left text-sm hover:bg-accent z-10"
              >
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="text-muted-foreground">{suggestion.description}</span>
                <span className="ml-auto font-medium">₹{suggestion.amount}</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        {description && category === "auto" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground flex items-center gap-1"
          >
            <Sparkles className="h-3 w-3" />
            Will be categorized as:{" "}
            <span className="font-medium capitalize">
              {suggestedCategory.replace("_", " ")}
            </span>
          </motion.p>
        )}
      </div>

      {/* Who paid */}
      <div className="space-y-2">
        <Label className="text-base">Who paid?</Label>
        <Select value={paidBy} onValueChange={setPaidBy}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Select payer" />
          </SelectTrigger>
          <SelectContent>
            {members.map((member) => (
              <SelectItem key={member.userId} value={member.userId}>
                {member.userId === currentProfile?.id ? "Me" : member.userName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Split type */}
      <div className="space-y-2">
        <Label className="text-base">Split type</Label>
        <Select
          value={splitType}
          onValueChange={(v) => setSplitType(v as SplitType)}
        >
          <SelectTrigger className="h-12">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="equal">Split equally</SelectItem>
            <SelectItem value="custom">Custom amounts</SelectItem>
            <SelectItem value="one_owes_all">Full amount owed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Participant selection */}
      <div className="space-y-2">
        <Label className="text-base">Split between</Label>
        <div className="rounded-lg border border-border p-3 space-y-2">
          {members.map((member) => (
            <div key={member.userId} className="flex items-center gap-3">
              <Checkbox
                checked={selectedParticipantIds.has(member.userId)}
                onCheckedChange={() => toggleParticipant(member.userId)}
              />
              <span className="flex-1 text-sm">
                {member.userId === currentProfile?.id ? "Me" : member.userName}
              </span>
              {splitType === "custom" && selectedParticipantIds.has(member.userId) && (
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={customAmounts[member.userId] || ""}
                  onChange={(e) =>
                    setCustomAmounts((prev) => ({
                      ...prev,
                      [member.userId]: e.target.value,
                    }))
                  }
                  className="w-24 h-8 text-sm"
                />
              )}
              {splitType === "equal" && selectedParticipantIds.has(member.userId) && amount && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  ₹{(parseFloat(amount) / selectedParticipantIds.size).toFixed(2)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <Collapsible open={showOptional} onOpenChange={setShowOptional}>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-between text-muted-foreground h-12"
          >
            More options
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showOptional ? "rotate-180" : ""}`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as ExpenseCategory | "auto")}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Auto-detect" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-detect</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Button
        type="submit"
        className="w-full h-14 text-base font-medium"
        disabled={loading || members.length === 0}
      >
        {loading ? "Adding..." : "Add Expense"}
      </Button>

      {members.length <= 1 && (
        <p className="text-xs text-center text-muted-foreground">
          Invite members to your group to split expenses
        </p>
      )}
    </motion.form>
  );
};

export default AddExpenseForm;
