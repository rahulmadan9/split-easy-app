import { Expense } from "@/hooks/useGroupExpenses";
import { Profile } from "@/hooks/useProfiles";

interface MonthSummaryProps {
  expenses: Expense[];
  currentProfile: Profile | null;
  roommate: null;
  formatAmount: (num: number) => string;
}

const MonthSummary = ({
  expenses,
  currentProfile,
  formatAmount,
}: MonthSummaryProps) => {
  const expensesOnly = expenses.filter((e) => !e.is_payment && !e.is_settlement);

  const totalSpent = expensesOnly.reduce((sum, e) => sum + Number(e.amount), 0);

  const mySpending = expensesOnly
    .filter((e) => e.paid_by === currentProfile?.id)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const othersSpending = totalSpent - mySpending;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-card border border-border/50 rounded-lg p-4">
        <p className="text-xs text-muted-foreground mb-1">Total Spent</p>
        <p className="text-xl font-bold tabular-nums">{formatAmount(totalSpent)}</p>
      </div>
      <div className="bg-card border border-border/50 rounded-lg p-4">
        <p className="text-xs text-muted-foreground mb-1">You Paid</p>
        <p className="text-lg font-semibold tabular-nums">{formatAmount(mySpending)}</p>
      </div>
      <div className="col-span-2 bg-card border border-border/50 rounded-lg p-4">
        <p className="text-xs text-muted-foreground mb-1">Others Paid</p>
        <p className="text-lg font-semibold tabular-nums">{formatAmount(othersSpending)}</p>
      </div>
    </div>
  );
};

export default MonthSummary;
