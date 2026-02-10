import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { RecurringItemWithStatus } from "@/hooks/useRecurringExpenses";

interface BulkConfirmDialogProps {
  items: RecurringItemWithStatus[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBulkConfirm: (items: { recurringExpenseId: string; amount: number }[]) => Promise<void>;
}

const BulkConfirmDialog = ({
  items,
  open,
  onOpenChange,
  onBulkConfirm,
}: BulkConfirmDialogProps) => {
  const [loading, setLoading] = useState(false);

  const total = items.reduce((sum, item) => sum + item.defaultAmount, 0);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onBulkConfirm(
        items.map((item) => ({
          recurringExpenseId: item.id,
          amount: item.defaultAmount,
        }))
      );
      toast.success(`${items.length} items confirmed as paid`);
      onOpenChange(false);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to confirm";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirm {items.length} Items</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-4 max-h-64 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between text-sm"
            >
              <span>{item.description}</span>
              <span className="font-medium tabular-nums">
                ₹{item.defaultAmount.toLocaleString("en-IN")}
              </span>
            </div>
          ))}
          <div className="border-t border-border pt-3 flex items-center justify-between font-medium">
            <span>Total</span>
            <span className="tabular-nums">
              ₹{total.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? "Confirming..." : "Confirm All"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkConfirmDialog;
