import { useState } from "react";
import { useGroupBalance } from "@/hooks/useGroupBalance";
import { useGroupExpenses } from "@/hooks/useGroupExpenses";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Banknote, Loader2 } from "lucide-react";
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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settlements || settlements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-positive/10 p-4 mb-4">
          <Check className="h-8 w-8 text-positive" />
        </div>
        <p className="text-lg font-semibold text-foreground">All settled up!</p>
        <p className="text-sm text-muted-foreground mt-1">No payments needed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground px-1">
        {settlements.length} payment{settlements.length > 1 ? "s" : ""} to settle all debts
      </p>
      <AnimatePresence>
        {settlements.map((settlement, index) => {
          const id = `${settlement.from}-${settlement.to}`;
          const isRecorded = recordedIds.has(id);
          const isRecording = recordingId === id;

          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-2xl border p-4 transition-colors ${
                isRecorded
                  ? "bg-positive/5 border-positive/20"
                  : "bg-card border-border/50"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="font-semibold text-foreground">{settlement.fromName}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-semibold text-foreground">{settlement.toName}</span>
                  </div>
                </div>
                <span className="text-lg font-bold tabular-nums text-foreground">
                  ₹{settlement.amount.toLocaleString("en-IN")}
                </span>
              </div>

              {isRecorded ? (
                <div className="flex items-center gap-2 text-positive">
                  <div className="rounded-full bg-positive/10 p-1">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm font-medium">Payment recorded</span>
                </div>
              ) : (
                <Button
                  className="w-full rounded-xl"
                  onClick={() => handleRecordSettlement(settlement)}
                  disabled={isRecording}
                >
                  {isRecording ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    <>
                      <Banknote className="h-4 w-4 mr-2" />
                      Record Payment
                    </>
                  )}
                </Button>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
