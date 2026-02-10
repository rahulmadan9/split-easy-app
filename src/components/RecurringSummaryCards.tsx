import type { RecurringSummary } from "@/hooks/useRecurringExpenses";

interface RecurringSummaryCardsProps {
  summary: RecurringSummary;
  formatAmount: (num: number) => string;
}

const RecurringSummaryCards = ({ summary, formatAmount }: RecurringSummaryCardsProps) => {
  const { totalFixed, paidSoFar, remaining } = summary;

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-card border border-border/50 rounded-lg p-4">
        <p className="text-xs text-muted-foreground mb-1">Total Fixed</p>
        <p className="text-lg font-bold tabular-nums">{formatAmount(totalFixed)}</p>
      </div>
      <div className="bg-card border border-border/50 rounded-lg p-4">
        <p className="text-xs text-muted-foreground mb-1">Paid So Far</p>
        <p className="text-lg font-bold tabular-nums text-positive">
          {formatAmount(paidSoFar)}
        </p>
      </div>
      <div className="bg-card border border-border/50 rounded-lg p-4">
        <p className="text-xs text-muted-foreground mb-1">Remaining</p>
        <p
          className={`text-lg font-bold tabular-nums ${
            remaining === 0 ? "text-positive" : "text-muted-foreground"
          }`}
        >
          {formatAmount(remaining)}
        </p>
      </div>
    </div>
  );
};

export default RecurringSummaryCards;
