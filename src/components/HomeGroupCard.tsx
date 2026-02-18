import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useGroupBalance } from "@/hooks/useGroupBalance";
import type { Group } from "@/hooks/useGroups";

interface HomeGroupCardProps {
  group: Group;
  index: number;
  onNavigate: (groupId: string) => void;
  onQuickAdd: (groupId: string) => void;
}

const formatBalance = (amount: number) => {
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
  return amount > 0 ? `+${formatted}` : `-${formatted}`;
};

const HomeGroupCard = ({ group, index, onNavigate, onQuickAdd }: HomeGroupCardProps) => {
  const { myBalance, loading } = useGroupBalance(group.id);

  const isSettled = !loading && Math.abs(myBalance) < 0.01;
  const isOwed = myBalance > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index }}
      onClick={() => onNavigate(group.id)}
      className="w-full rounded-xl border border-border/50 bg-card px-3 py-2.5 hover:bg-accent/50 transition-colors text-left cursor-pointer"
    >
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
          {group.name.charAt(0).toUpperCase()}
        </div>

        <p className="text-sm font-medium text-foreground truncate flex-1 min-w-0">
          {group.name}
        </p>

        <span className="shrink-0 text-xs font-semibold tabular-nums">
          {loading ? (
            <span className="text-muted-foreground">...</span>
          ) : isSettled ? (
            <span className="text-muted-foreground">Settled</span>
          ) : (
            <span className={isOwed ? "text-positive" : "text-negative"}>
              {formatBalance(myBalance)}
            </span>
          )}
        </span>

        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd(group.id);
          }}
          className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md"
          aria-label={`Add expense in ${group.name}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default HomeGroupCard;
