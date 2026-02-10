import { motion } from "framer-motion";
import { Expense } from "@/hooks/useGroupExpenses";
import {
  Home,
  Zap,
  ShoppingCart,
  Package,
  UtensilsCrossed,
  ShoppingBag,
  MoreHorizontal,
} from "lucide-react";

interface CategoryBreakdownProps {
  expenses: Expense[];
  formatAmount: (num: number) => string;
}

const categoryConfig: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  rent: { label: "Rent", icon: Home, color: "bg-blue-500" },
  utilities: { label: "Utilities", icon: Zap, color: "bg-yellow-500" },
  groceries: { label: "Groceries", icon: ShoppingCart, color: "bg-green-500" },
  household_supplies: { label: "Household", icon: Package, color: "bg-purple-500" },
  shared_meals: { label: "Meals", icon: UtensilsCrossed, color: "bg-orange-500" },
  purchases: { label: "Purchases", icon: ShoppingBag, color: "bg-pink-500" },
  other: { label: "Other", icon: MoreHorizontal, color: "bg-gray-500" },
};

const CategoryBreakdown = ({ expenses, formatAmount }: CategoryBreakdownProps) => {
  const expensesOnly = expenses.filter((e) => !e.is_payment && !e.is_settlement);
  const totalSpent = expensesOnly.reduce((sum, e) => sum + Number(e.amount), 0);

  const categoryTotals = expensesOnly.reduce(
    (acc, expense) => {
      const cat = expense.category;
      acc[cat] = (acc[cat] || 0) + Number(expense.amount);
      return acc;
    },
    {} as Record<string, number>
  );

  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
      config: categoryConfig[category] || categoryConfig.other,
    }));

  if (sortedCategories.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No expenses to analyze
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedCategories.map((item, index) => {
        const Icon = item.config.icon;
        return (
          <motion.div
            key={item.category}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3"
          >
            <div
              className={`h-10 w-10 rounded-lg ${item.config.color} flex items-center justify-center shrink-0`}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm truncate">
                  {item.config.label}
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  {formatAmount(item.amount)}
                </span>
              </div>
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={`absolute inset-y-0 left-0 ${item.config.color} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percentage}%` }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {item.percentage.toFixed(1)}%
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default CategoryBreakdown;
