import { useEffect } from "react";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";

interface ExpenseParticipant {
  userId: string;
  userName: string;
  amount: number;
}

interface ParticipantSelectorProps {
  groupId: string;
  selectedParticipants: ExpenseParticipant[];
  onChange: (participants: ExpenseParticipant[]) => void;
  splitType: "equal" | "custom" | "one_owes_all";
  totalAmount: number;
  payerId: string;
}

export function ParticipantSelector({
  groupId,
  selectedParticipants,
  onChange,
  splitType,
  totalAmount,
  payerId,
}: ParticipantSelectorProps) {
  const { members, loading } = useGroupMembers(groupId);

  const selectedIds = new Set(selectedParticipants.map((p) => p.userId));

  // Recalculate equal splits when participants or total change
  useEffect(() => {
    if (splitType === "equal" && selectedParticipants.length > 0 && totalAmount > 0) {
      const equalAmount = Math.round((totalAmount / selectedParticipants.length) * 100) / 100;
      const updated = selectedParticipants.map((p) => ({
        ...p,
        amount: equalAmount,
      }));
      // Avoid infinite loop by checking if amounts actually changed
      const hasChanged = updated.some(
        (u, i) => u.amount !== selectedParticipants[i].amount
      );
      if (hasChanged) {
        onChange(updated);
      }
    }
  }, [splitType, totalAmount, selectedParticipants.length]);

  const toggleParticipant = (userId: string, userName: string) => {
    if (splitType === "one_owes_all") {
      // In one_owes_all mode, only one non-payer person can be selected
      if (userId === payerId) return;
      onChange([{ userId, userName, amount: totalAmount }]);
      return;
    }

    if (selectedIds.has(userId)) {
      const filtered = selectedParticipants.filter((p) => p.userId !== userId);
      if (splitType === "equal" && filtered.length > 0 && totalAmount > 0) {
        const equalAmount = Math.round((totalAmount / filtered.length) * 100) / 100;
        onChange(filtered.map((p) => ({ ...p, amount: equalAmount })));
      } else {
        onChange(filtered);
      }
    } else {
      const newParticipant: ExpenseParticipant = { userId, userName, amount: 0 };
      const updated = [...selectedParticipants, newParticipant];
      if (splitType === "equal" && totalAmount > 0) {
        const equalAmount = Math.round((totalAmount / updated.length) * 100) / 100;
        onChange(updated.map((p) => ({ ...p, amount: equalAmount })));
      } else {
        onChange(updated);
      }
    }
  };

  const handleCustomAmountChange = (userId: string, amount: number) => {
    onChange(
      selectedParticipants.map((p) =>
        p.userId === userId ? { ...p, amount } : p
      )
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const customTotal = selectedParticipants.reduce((sum, p) => sum + p.amount, 0);
  const customDiff = splitType === "custom" ? totalAmount - customTotal : 0;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        {members.map((member, index) => {
          const isSelected = selectedIds.has(member.userId);
          const participant = selectedParticipants.find(
            (p) => p.userId === member.userId
          );
          const isDisabledInOneOwes =
            splitType === "one_owes_all" && member.userId === payerId;

          return (
            <motion.div
              key={member.userId}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                isSelected ? "bg-primary/5 border border-primary/20" : "hover:bg-accent/50"
              } ${isDisabledInOneOwes ? "opacity-40" : ""}`}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() =>
                    toggleParticipant(member.userId, member.userName)
                  }
                  disabled={isDisabledInOneOwes}
                />
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                    {member.userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">
                    {member.userName}
                    {member.userId === payerId && (
                      <span className="text-muted-foreground ml-1 text-xs">(payer)</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {splitType === "equal" && isSelected && participant && (
                  <span className="text-sm text-muted-foreground font-medium">
                    ₹{participant.amount.toLocaleString("en-IN")}
                  </span>
                )}
                {splitType === "custom" && isSelected && (
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={participant?.amount || ""}
                      onChange={(e) =>
                        handleCustomAmountChange(
                          member.userId,
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-24 h-8 text-sm text-right"
                      placeholder="0"
                    />
                  </div>
                )}
                {splitType === "one_owes_all" && isSelected && (
                  <span className="text-sm text-muted-foreground font-medium">
                    ₹{totalAmount.toLocaleString("en-IN")}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Custom split total indicator */}
      {splitType === "custom" && selectedParticipants.length > 0 && (
        <div
          className={`text-xs text-right px-1 font-medium ${
            Math.abs(customDiff) < 0.01
              ? "text-green-600"
              : "text-destructive"
          }`}
        >
          {Math.abs(customDiff) < 0.01
            ? "Split amounts match total"
            : customDiff > 0
              ? `₹${customDiff.toLocaleString("en-IN")} remaining to assign`
              : `₹${Math.abs(customDiff).toLocaleString("en-IN")} over the total`}
        </div>
      )}
    </div>
  );
}
