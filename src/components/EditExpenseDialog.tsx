import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { Expense, ExpenseInsert } from "@/hooks/useGroupExpenses";
import type { GroupMember } from "@/hooks/useGroupMembers";
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

interface EditExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense;
  members: GroupMember[];
  onSave: (data: Partial<ExpenseInsert>) => Promise<void>;
}

const EditExpenseDialog = ({
  open,
  onOpenChange,
  expense,
  members,
  onSave,
}: EditExpenseDialogProps) => {
  const [amount, setAmount] = useState(expense.amount.toString());
  const [description, setDescription] = useState(expense.description);
  const [paidBy, setPaidBy] = useState(expense.paid_by);
  const [splitType, setSplitType] = useState<SplitType>(expense.split_type as SplitType);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<Set<string>>(
    new Set(expense.participants.map((p) => p.userId))
  );
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    if (expense.split_type === "custom") {
      expense.participants.forEach((p) => {
        map[p.userId] = p.amount.toString();
      });
    }
    return map;
  });
  const [category, setCategory] = useState<ExpenseCategory>(expense.category as ExpenseCategory);
  const [date, setDate] = useState(expense.expense_date);
  const [notes, setNotes] = useState(expense.notes || "");
  const [saving, setSaving] = useState(false);

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

  const handleSave = async () => {
    if (!description.trim() || !amount || parseFloat(amount) <= 0) {
      toast.error("Please fill in amount and description");
      return;
    }
    if (selectedParticipantIds.size === 0) {
      toast.error("Select at least one participant");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        description,
        amount: parseFloat(amount),
        paid_by: paidBy,
        split_type: splitType,
        participants,
        category,
        expense_date: date,
        notes: notes || null,
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to update expense");
    } finally {
      setSaving(false);
    }
  };

  if (expense.is_settlement || expense.is_payment) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settlement</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p>Amount: ₹{expense.amount.toLocaleString("en-IN")}</p>
            <p>{expense.description}</p>
            <p className="text-muted-foreground">Settlements cannot be edited.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-amount">Amount</Label>
            <Input
              id="edit-amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-12 text-lg font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Input
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label>Who paid?</Label>
            <Select value={paidBy} onValueChange={setPaidBy}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.userId} value={member.userId}>
                    {member.userName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Split type</Label>
            <Select value={splitType} onValueChange={(v) => setSplitType(v as SplitType)}>
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

          <div className="space-y-2">
            <Label>Split between</Label>
            <div className="rounded-lg border border-border p-3 space-y-2">
              {members.map((member) => (
                <div key={member.userId} className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedParticipantIds.has(member.userId)}
                    onCheckedChange={() => toggleParticipant(member.userId)}
                  />
                  <span className="flex-1 text-sm">{member.userName}</span>
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

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-date">Date</Label>
            <Input
              id="edit-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <Button
            onClick={handleSave}
            className="w-full h-12"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditExpenseDialog;
