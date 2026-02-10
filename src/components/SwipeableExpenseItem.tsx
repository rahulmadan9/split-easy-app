import { useState, useRef } from "react";
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Expense } from "@/hooks/useGroupExpenses";

interface SwipeableExpenseItemProps {
  expense: Expense;
  isPaidByMe: boolean;
  onDelete: (id: string) => void;
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

const SwipeableExpenseItem = ({
  expense,
  isPaidByMe,
  onDelete,
  formatAmount,
}: SwipeableExpenseItemProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const constraintsRef = useRef(null);
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-100, -60], [1, 0]);
  const deleteScale = useTransform(x, [-100, -60], [1, 0.8]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -80) {
      setIsDeleting(true);
      onDelete(expense.id);
    }
  };

  if (isDeleting) {
    return (
      <motion.div
        initial={{ height: "auto", opacity: 1 }}
        animate={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      />
    );
  }

  return (
    <div ref={constraintsRef} className="relative overflow-hidden">
      {/* Delete background */}
      <motion.div
        className="absolute inset-y-0 right-0 flex items-center justify-end bg-destructive px-6"
        style={{ opacity: deleteOpacity }}
      >
        <motion.div style={{ scale: deleteScale }}>
          <Trash2 className="h-5 w-5 text-destructive-foreground" />
        </motion.div>
      </motion.div>

      {/* Swipeable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative bg-card"
      >
        <div className="flex items-center justify-between p-4 min-h-[72px]">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-foreground truncate">
                {expense.is_settlement ? "Settlement" : expense.is_payment ? "Payment" : expense.description}
              </p>
              {!expense.is_payment && !expense.is_settlement && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  {categoryLabels[expense.category] || expense.category}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {format(new Date(expense.expense_date), "MMM d")} •{" "}
              {isPaidByMe ? "You paid" : `${expense.paid_by_name} paid`}
              {expense.split_type === "equal" && ` • Equal`}
              {expense.split_type === "one_owes_all" && " • Full"}
            </p>
          </div>
          <p
            className={`font-semibold tabular-nums text-lg ${
              expense.is_settlement || expense.is_payment
                ? "text-positive"
                : isPaidByMe
                ? "text-positive"
                : "text-destructive"
            }`}
          >
            {formatAmount(Number(expense.amount))}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SwipeableExpenseItem;
