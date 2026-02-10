import { useState } from "react";
import { useGroupBalance } from "@/hooks/useGroupBalance";
import { useGroupExpenses } from "@/hooks/useGroupExpenses";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Banknote } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface SettlementSuggestionsProps {
  groupId: string;
}

export function SettlementSuggestions({ groupId }: SettlementSuggestionsProps) {
  const { settlements, loading: balanceLoading } = useGroupBalance(groupId);
  const { addExpense } = useGroupExpenses(groupId);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [recordedIds, setRecordedIds] = useState<Set<string>>(new Set());

  const handleRecordSettlement = async (settlement: {
    from: string;
    fromName: string;
    to: string;
    toName: string;
    amount: number;
  }) => {
    const id = `${settlement.from}-${settlement.to}`;
    setRecordingId(id);
    try {
      await addExpense({
        groupId: groupId,
        description: `Settlement: ${settlement.fromName} to ${settlement.toName}`,
        amount: settlement.amount,
        paid_by: settlement.from,
        is_settlement: true,
        participants: [
          { userId: settlement.from, userName: settlement.fromName, amount: 0 },
          { userId: settlement.to, userName: settlement.toName, amount: settlement.amount },
        ],
      });
      setRecordedIds((prev) => new Set(prev).add(id));
      toast.success("Settlement recorded!");
    } catch {
      toast.error("Failed to record settlement");
    } finally {
      setRecordingId(null);
    }
  };

  if (balanceLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!settlements || settlements.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Banknote className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm">All settled up! No payments needed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        Suggested Settlements
      </h3>
      <AnimatePresence>
        {settlements.map((settlement) => {
          const id = `${settlement.from}-${settlement.to}`;
          const isRecorded = recordedIds.has(id);
          const isRecording = recordingId === id;

          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                isRecorded ? "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800" : "bg-card"
              }`}
            >
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{settlement.fromName}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{settlement.toName}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm">
                  ₹{settlement.amount.toLocaleString("en-IN")}
                </span>
                {isRecorded ? (
                  <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                    <Check className="h-3.5 w-3.5" />
                    Recorded
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRecordSettlement(settlement)}
                    disabled={isRecording}
                  >
                    {isRecording ? "Recording..." : "Record Payment"}
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
