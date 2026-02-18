import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useGroupExpenses, Expense } from "@/hooks/useGroupExpenses";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import { useProfiles } from "@/hooks/useProfiles";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MonthSelector from "./MonthSelector";
import MonthSummary from "./MonthSummary";
import CategoryBreakdown from "./CategoryBreakdown";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import SwipeableExpenseItem from "./SwipeableExpenseItem";
import EditExpenseDialog from "./EditExpenseDialog";

interface ExpensesViewProps {
  groupId: string | null;
  mode?: "full" | "list" | "analytics";
  selectedMonth?: Date;
  onMonthChange?: (date: Date) => void;
}

const ExpensesView = ({ groupId, mode = "full", selectedMonth: externalMonth, onMonthChange: externalMonthChange }: ExpensesViewProps) => {
  const { expenses, loading, deleteExpense, updateExpense } = useGroupExpenses(groupId);
  const { members } = useGroupMembers(groupId);
  const { currentProfile } = useProfiles();

  const [internalMonth, setInternalMonth] = useState(new Date());
  const selectedMonth = externalMonth ?? internalMonth;
  const setSelectedMonth = externalMonthChange ?? setInternalMonth;
  const [activeTab, setActiveTab] = useState("list");
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const formatAmount = (num: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(num);
  };

  const monthExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.expense_date);
      return (
        expenseDate.getMonth() === selectedMonth.getMonth() &&
        expenseDate.getFullYear() === selectedMonth.getFullYear()
      );
    });
  }, [expenses, selectedMonth]);

  const confirmDelete = async () => {
    if (!deletingExpense) return;

    setDeletingIds((prev) => new Set(prev).add(deletingExpense.id));
    setDeletingExpense(null);

    try {
      await deleteExpense(deletingExpense.id);
      toast.success("Expense deleted");
    } catch (error: any) {
      toast.error("Failed to delete expense");
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(deletingExpense.id);
        return next;
      });
    }
  };

  const handleSwipeDelete = async (id: string) => {
    const expense = expenses.find((e) => e.id === id);
    if (expense) {
      setDeletingExpense(expense);
    }
  };

  const monthLabel = format(selectedMonth, "MMMM yyyy");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-muted-foreground"
        >
          Loading expenses...
        </motion.div>
      </div>
    );
  }

  if (!groupId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Select a group to view expenses
      </div>
    );
  }

  const monthSelector = (
    <div className="px-4 py-4 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur-sm z-10 space-y-4">
      <div className="flex items-center justify-between">
        <MonthSelector
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />
      </div>
    </div>
  );

  const listContent = (
    <>
      {monthExpenses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 px-6 text-center"
        >
          <p className="text-lg font-medium text-foreground mb-2">
            No expenses in {monthLabel}
          </p>
          <p className="text-sm text-muted-foreground">
            Tap the + button to add an expense
          </p>
        </motion.div>
      ) : (
        <>
          <div className="px-4 py-2 text-xs text-muted-foreground">
            Swipe left to delete - {monthExpenses.length} items
          </div>
          <div className="divide-y divide-border/50">
            <AnimatePresence mode="popLayout">
              {monthExpenses.map((expense, index) => {
                const isPaidByMe = expense.paid_by === currentProfile?.id;
                if (deletingIds.has(expense.id)) return null;

                return (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100, height: 0 }}
                    transition={{ delay: index * 0.02 }}
                    layout
                  >
                    <SwipeableExpenseItem
                      expense={expense}
                      isPaidByMe={isPaidByMe}
                      onDelete={handleSwipeDelete}
                      onTap={(e) => setEditingExpense(e)}
                      formatAmount={formatAmount}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </>
      )}
    </>
  );

  const analyticsContent = (
    <div className="space-y-6 px-4">
      <MonthSummary
        expenses={monthExpenses}
        currentProfile={currentProfile}
        roommate={null}
        formatAmount={formatAmount}
      />

      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Spending by Category
        </h3>
        <CategoryBreakdown
          expenses={monthExpenses}
          formatAmount={formatAmount}
        />
      </div>
    </div>
  );

  const dialogs = (
    <>
      <DeleteConfirmDialog
        open={!!deletingExpense}
        onOpenChange={(open) => !open && setDeletingExpense(null)}
        onConfirm={confirmDelete}
      />

      {editingExpense && (
        <EditExpenseDialog
          open={!!editingExpense}
          onOpenChange={(open) => !open && setEditingExpense(null)}
          expense={editingExpense}
          members={members}
          onSave={async (data) => {
            await updateExpense(editingExpense.id, data);
            toast.success("Expense updated");
            setEditingExpense(null);
          }}
        />
      )}
    </>
  );

  if (mode === "list") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-4">
        {monthSelector}
        <div className="mt-4">{listContent}</div>
        {dialogs}
      </motion.div>
    );
  }

  if (mode === "analytics") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-4">
        {monthSelector}
        <div className="mt-4">{analyticsContent}</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-4"
    >
      {monthSelector}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 pt-4">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-0 -mx-4">
          {listContent}
        </TabsContent>

        <TabsContent value="analytics" className="mt-0 space-y-6">
          {analyticsContent}
        </TabsContent>
      </Tabs>

      {dialogs}
    </motion.div>
  );
};

export default ExpensesView;
