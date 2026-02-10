import { Check, Undo2, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import type { RecurringItemWithStatus } from "@/hooks/useRecurringExpenses";

interface RecurringItemRowProps {
  item: RecurringItemWithStatus;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onConfirm: (item: RecurringItemWithStatus) => void;
  onEdit: (item: RecurringItemWithStatus) => void;
  onUndo: (confirmationId: string) => void;
  formatAmount: (num: number) => string;
}

const categoryLabels: Record<string, string> = {
  rent: "Rent",
  utilities: "Utilities",
  groceries: "Groceries",
  household_supplies: "Household",
  shared_meals: "Meals",
  purchases: "Purchases",
  other: "Other",
};

const RecurringItemRow = ({
  item,
  isSelected,
  onToggleSelect,
  onConfirm,
  onEdit,
  onUndo,
  formatAmount,
}: RecurringItemRowProps) => {
  const isPending = item.isPending;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
        isPending
          ? "bg-card border-border/50"
          : "bg-card/50 border-border/30"
      }`}
    >
      {isPending && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(item.id)}
        />
      )}

      {!isPending && (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-positive/20">
          <Check className="h-3 w-3 text-positive" />
        </div>
      )}

      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => (isPending ? onConfirm(item) : undefined)}
      >
        <div className="flex items-center gap-2">
          <span
            className={`font-medium truncate ${
              !isPending ? "line-through text-muted-foreground" : ""
            }`}
          >
            {item.description}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {categoryLabels[item.category] || item.category}
          </Badge>
          <Badge
            variant={item.expenseType === "shared" ? "default" : "secondary"}
            className="text-[10px] px-1.5 py-0"
          >
            {item.expenseType}
          </Badge>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className={`font-medium tabular-nums ${!isPending ? "text-muted-foreground" : ""}`}>
          {formatAmount(
            isPending
              ? item.defaultAmount
              : item.confirmation?.confirmedAmount || item.defaultAmount
          )}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {isPending ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(item)}
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => item.confirmation && onUndo(item.confirmation.id)}
            title="Undo confirmation"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default RecurringItemRow;
