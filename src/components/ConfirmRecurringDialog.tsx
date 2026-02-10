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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { RecurringItemWithStatus } from "@/hooks/useRecurringExpenses";
import { calculateAmount } from "@/lib/amountCalculator";

interface ConfirmRecurringDialogProps {
  item: RecurringItemWithStatus | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (recurringExpenseId: string, amount: number) => Promise<void>;
}

const ConfirmRecurringDialog = ({
  item,
  open,
  onOpenChange,
  onConfirm,
}: ConfirmRecurringDialogProps) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset amount when item changes
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && item) {
      setAmount(String(item.defaultAmount));
    }
    onOpenChange(isOpen);
  };

  const handleAmountBlur = () => {
    const calculated = calculateAmount(amount);
    if (calculated !== amount) {
      setAmount(calculated);
    }
  };

  const handleConfirm = async () => {
    if (!item) return;
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      await onConfirm(item.id, parsedAmount);
      toast.success(`${item.description} confirmed as paid`);
      onOpenChange(false);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to confirm";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirm Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">{item.description}</span>
            <Badge variant={item.expenseType === "shared" ? "default" : "secondary"}>
              {item.expenseType}
            </Badge>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-amount">Amount</Label>
            <Input
              id="confirm-amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onBlur={handleAmountBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAmountBlur();
                }
              }}
              className="h-12 text-lg"
            />
            {parseFloat(amount) !== item.defaultAmount && amount !== "" && (
              <p className="text-xs text-muted-foreground">
                Default: ₹{item.defaultAmount.toLocaleString("en-IN")}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? "Confirming..." : "Confirm as Paid"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmRecurringDialog;
