import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRecurringExpenses } from "@/hooks/useRecurringExpenses";
import type { RecurringItemWithStatus } from "@/hooks/useRecurringExpenses";
import RecurringSummaryCards from "./RecurringSummaryCards";
import RecurringItemList from "./RecurringItemList";
import ConfirmRecurringDialog from "./ConfirmRecurringDialog";
import BulkConfirmDialog from "./BulkConfirmDialog";
import AddRecurringDialog from "./AddRecurringDialog";
import EditRecurringDialog from "./EditRecurringDialog";

interface RecurringViewProps {
  groupId: string | null;
}

const formatAmount = (num: number) => {
  return `₹${Math.abs(num).toLocaleString("en-IN")}`;
};

const RecurringView = ({ groupId }: RecurringViewProps) => {
  const {
    loading,
    monthKey,
    itemsWithStatus,
    summary,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    confirmRecurringExpense,
    bulkConfirm,
    undoConfirmation,
  } = useRecurringExpenses(groupId);

  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<RecurringItemWithStatus | null>(null);
  const [confirmItem, setConfirmItem] = useState<RecurringItemWithStatus | null>(null);
  const [bulkItems, setBulkItems] = useState<RecurringItemWithStatus[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);

  const monthLabel = new Date(monthKey + "-01").toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const handleUndoConfirmation = async (confirmationId: string) => {
    try {
      await undoConfirmation(confirmationId);
      toast.success("Confirmation undone");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to undo";
      toast.error(msg);
    }
  };

  const handleBulkConfirmStart = (items: RecurringItemWithStatus[]) => {
    setBulkItems(items);
    setBulkOpen(true);
  };

  if (!groupId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Select a group to view recurring expenses
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-muted-foreground"
        >
          Loading...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{monthLabel}</p>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <RecurringSummaryCards summary={summary} formatAmount={formatAmount} />

      <RecurringItemList
        items={itemsWithStatus}
        onConfirmItem={setConfirmItem}
        onEditItem={setEditItem}
        onUndoConfirmation={handleUndoConfirmation}
        onBulkConfirm={handleBulkConfirmStart}
        formatAmount={formatAmount}
      />

      <AddRecurringDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={addRecurringExpense}
        groupId={groupId}
      />

      <EditRecurringDialog
        item={editItem}
        open={!!editItem}
        onOpenChange={(open) => !open && setEditItem(null)}
        onUpdate={updateRecurringExpense}
        onDelete={deleteRecurringExpense}
        groupId={groupId}
      />

      <ConfirmRecurringDialog
        item={confirmItem}
        open={!!confirmItem}
        onOpenChange={(open) => !open && setConfirmItem(null)}
        onConfirm={confirmRecurringExpense}
      />

      <BulkConfirmDialog
        items={bulkItems}
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onBulkConfirm={bulkConfirm}
      />
    </div>
  );
};

export default RecurringView;
