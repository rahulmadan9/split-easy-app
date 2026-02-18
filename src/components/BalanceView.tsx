import { motion } from "framer-motion";
import { Banknote } from "lucide-react";
import { useGroupBalance } from "@/hooks/useGroupBalance";

interface BalanceViewProps {
  groupId: string | null;
  onSettleUp?: () => void;
}

const BalanceView = ({ groupId, onSettleUp }: BalanceViewProps) => {
  const { myBalance, settlements, loading } = useGroupBalance(groupId);

  const formatAmount = (num: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(num));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
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

  const isSettled = Math.abs(myBalance) < 0.01;
  const othersOweMe = myBalance > 0;

  const getStatusColor = () => {
    if (othersOweMe) return "text-positive";
    if (!isSettled) return "text-negative";
    return "text-muted-foreground";
  };

  const getBackgroundGradient = () => {
    if (othersOweMe) return "from-positive/5 to-transparent";
    if (!isSettled) return "from-negative/5 to-transparent";
    return "from-muted/20 to-transparent";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center px-6 py-8"
    >
      <div
        className={`w-full max-w-sm rounded-3xl bg-gradient-to-b ${getBackgroundGradient()} p-8 text-center`}
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4"
        >
          {isSettled
            ? "Status"
            : othersOweMe
            ? "You are owed"
            : "You owe"}
        </motion.p>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: 0.15,
            type: "spring",
            stiffness: 200,
            damping: 15,
          }}
        >
          {isSettled ? (
            <div className="space-y-2">
              <p className="text-5xl font-bold text-foreground">✓</p>
              <p className="text-2xl font-semibold text-foreground">
                All settled!
              </p>
            </div>
          ) : (
            <p className={`text-6xl font-bold tabular-nums ${getStatusColor()}`}>
              {formatAmount(myBalance)}
            </p>
          )}
        </motion.div>
      </div>

      {/* Settle Up CTA */}
      {settlements.length > 0 && groupId && onSettleUp && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-5"
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onSettleUp}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-sm hover:opacity-90 transition-opacity"
          >
            <Banknote className="h-4 w-4" />
            Settle Up
          </motion.button>
        </motion.div>
      )}

      {!groupId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 rounded-xl bg-accent/50 border border-accent-foreground/10 p-4 text-center max-w-sm"
        >
          <p className="text-sm text-accent-foreground">
            Select a group to view balances
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BalanceView;
