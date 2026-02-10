import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckSquare } from "lucide-react";
import RecurringItemRow from "./RecurringItemRow";
import type { RecurringItemWithStatus } from "@/hooks/useRecurringExpenses";

interface RecurringItemListProps {
  items: RecurringItemWithStatus[];
  onConfirmItem: (item: RecurringItemWithStatus) => void;
  onEditItem: (item: RecurringItemWithStatus) => void;
  onUndoConfirmation: (confirmationId: string) => void;
  onBulkConfirm: (items: RecurringItemWithStatus[]) => void;
  formatAmount: (num: number) => string;
}

const RecurringItemList = ({
  items,
  onConfirmItem,
  onEditItem,
  onUndoConfirmation,
  onBulkConfirm,
  formatAmount,
}: RecurringItemListProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedItems = items.filter(
    (item) => selectedIds.has(item.id) && item.isPending
  );

  const handleBulkConfirm = () => {
    onBulkConfirm(selectedItems);
    setSelectedIds(new Set());
  };

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <p className="text-muted-foreground text-sm">No recurring expenses yet</p>
        <p className="text-muted-foreground text-xs mt-1">
          Add your fixed monthly costs to track them
        </p>
      </motion.div>
    );
  }

  // Separate pending and confirmed for display
  const pendingItems = items.filter((i) => i.isPending);
  const confirmedItems = items.filter((i) => !i.isPending);

  return (
    <div className="space-y-4">
      {pendingItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Pending ({pendingItems.length})
          </p>
          <AnimatePresence>
            {pendingItems.map((item) => (
              <RecurringItemRow
                key={item.id}
                item={item}
                isSelected={selectedIds.has(item.id)}
                onToggleSelect={toggleSelect}
                onConfirm={onConfirmItem}
                onEdit={onEditItem}
                onUndo={onUndoConfirmation}
                formatAmount={formatAmount}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {confirmedItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Confirmed ({confirmedItems.length})
          </p>
          <AnimatePresence>
            {confirmedItems.map((item) => (
              <RecurringItemRow
                key={item.id}
                item={item}
                isSelected={false}
                onToggleSelect={() => {}}
                onConfirm={onConfirmItem}
                onEdit={onEditItem}
                onUndo={onUndoConfirmation}
                formatAmount={formatAmount}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Floating action bar for bulk confirm */}
      <AnimatePresence>
        {selectedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-0 right-0 z-40 flex justify-center px-4"
          >
            <Button
              onClick={handleBulkConfirm}
              className="gap-2 shadow-lg px-6 h-12"
            >
              <CheckSquare className="h-4 w-4" />
              Confirm Selected ({selectedItems.length})
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecurringItemList;
