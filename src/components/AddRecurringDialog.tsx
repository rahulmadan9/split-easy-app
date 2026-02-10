import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useProfiles } from "@/hooks/useProfiles";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import type { RecurringExpenseInsert } from "@/hooks/useRecurringExpenses";
import type { ExpenseCategory, SplitType, RecurringExpenseType, ExpenseParticipant } from "@/integrations/firebase/types";
import { calculateAmount } from "@/lib/amountCalculator";

const categories: { value: ExpenseCategory; label: string }[] = [
  { value: "rent", label: "Rent" },
  { value: "utilities", label: "Utilities" },
  { value: "groceries", label: "Groceries" },
  { value: "household_supplies", label: "Household Supplies" },
  { value: "shared_meals", label: "Shared Meals" },
  { value: "purchases", label: "Purchases" },
  { value: "other", label: "Other" },
];

interface AddRecurringDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (input: RecurringExpenseInsert) => Promise<void>;
  groupId: string;
}

const AddRecurringDialog = ({
  open,
  onOpenChange,
  onAdd,
  groupId,
}: AddRecurringDialogProps) => {
  const { currentProfile } = useProfiles();
  const { members } = useGroupMembers(groupId);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseType, setExpenseType] = useState<RecurringExpenseType>("shared");
  const [category, setCategory] = useState<ExpenseCategory>("other");
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [paidBy, setPaidBy] = useState<string>("");

  const resetForm = () => {
    setDescription("");
    setAmount("");
    setExpenseType("shared");
    setCategory("other");
    setSplitType("equal");
    setPaidBy(currentProfile?.id || "");
  };

  const handleAmountBlur = () => {
    const calculated = calculateAmount(amount);
    if (calculated !== amount) {
      setAmount(calculated);
    }
  };

  const handleSubmit = async () => {
    if (!currentProfile) return;

    const paidById = paidBy || currentProfile.id;

    setLoading(true);
    try {
      const totalAmount = parseFloat(amount);
      let participants: ExpenseParticipant[];

      if (expenseType === "personal") {
        participants = [{
          userId: paidById,
          userName: members.find(m => m.userId === paidById)?.userName || "",
          amount: totalAmount,
        }];
      } else if (splitType === "equal") {
        const perPerson = Math.round((totalAmount / members.length) * 100) / 100;
        participants = members.map(m => ({
          userId: m.userId,
          userName: m.userName,
          amount: perPerson,
        }));
      } else if (splitType === "one_owes_all") {
        const owingMembers = members.filter(m => m.userId !== paidById);
        const perPerson = owingMembers.length > 0 ? Math.round((totalAmount / owingMembers.length) * 100) / 100 : 0;
        participants = owingMembers.map(m => ({
          userId: m.userId,
          userName: m.userName,
          amount: perPerson,
        }));
      } else {
        // custom - default to equal for now
        const perPerson = Math.round((totalAmount / members.length) * 100) / 100;
        participants = members.map(m => ({
          userId: m.userId,
          userName: m.userName,
          amount: perPerson,
        }));
      }

      await onAdd({
        description,
        defaultAmount: totalAmount,
        category,
        expenseType,
        splitType: expenseType === "personal" ? "one_owes_all" : splitType,
        participants,
        typicallyPaidBy: paidById,
      });

      toast.success("Recurring expense added");
      resetForm();
      onOpenChange(false);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to add";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Recurring Expense</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rec-description">Description</Label>
            <Input
              id="rec-description"
              placeholder="e.g. Rent, Netflix, Maid"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rec-amount">Default Amount</Label>
            <Input
              id="rec-amount"
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
              className="h-12 text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex gap-3">
              <Button
                type="button"
                variant={expenseType === "shared" ? "default" : "outline"}
                className="flex-1 h-12"
                onClick={() => setExpenseType("shared")}
              >
                Shared
              </Button>
              <Button
                type="button"
                variant={expenseType === "personal" ? "default" : "outline"}
                className="flex-1 h-12"
                onClick={() => setExpenseType("personal")}
              >
                Personal
              </Button>
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
            <Label>Who typically pays?</Label>
            <Select value={paidBy || currentProfile?.id || ""} onValueChange={setPaidBy}>
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

          {expenseType === "shared" && (
            <div className="space-y-2">
              <Label>Split Type</Label>
              <Select value={splitType} onValueChange={(v) => setSplitType(v as SplitType)}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equal">Split equally</SelectItem>
                  <SelectItem value="one_owes_all">Full amount owed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !description || !amount}
          >
            {loading ? "Adding..." : "Add Recurring"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddRecurringDialog;
