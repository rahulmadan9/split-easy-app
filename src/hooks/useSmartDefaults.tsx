import { useState, useEffect, useCallback } from "react";

type ExpenseCategory = "rent" | "utilities" | "groceries" | "household_supplies" | "shared_meals" | "purchases" | "other";
type SplitType = "equal" | "custom" | "one_owes_all";

interface ExpenseHistory {
  description: string;
  amount: number;
  category: ExpenseCategory;
  splitType: SplitType;
}

interface CategoryCorrection {
  keyword: string;
  category: ExpenseCategory;
}

const STORAGE_KEYS = {
  lastSplitType: "spliteasy_last_split_type",
  expenseHistory: "spliteasy_expense_history",
  categoryCorrections: "spliteasy_category_corrections",
  lastExpense: "spliteasy_last_expense",
};

// Built-in keyword mappings
const DEFAULT_KEYWORD_MAPPINGS: Record<string, ExpenseCategory> = {
  // Groceries
  costco: "groceries",
  walmart: "groceries",
  trader: "groceries",
  safeway: "groceries",
  kroger: "groceries",
  aldi: "groceries",
  publix: "groceries",
  "whole foods": "groceries",
  grocery: "groceries",
  bigbasket: "groceries",
  dmart: "groceries",
  reliance: "groceries",
  
  // Utilities
  "pg&e": "utilities",
  "pge": "utilities",
  electric: "utilities",
  gas: "utilities",
  water: "utilities",
  internet: "utilities",
  wifi: "utilities",
  "at&t": "utilities",
  verizon: "utilities",
  comcast: "utilities",
  jio: "utilities",
  airtel: "utilities",
  bsnl: "utilities",
  
  // Rent
  rent: "rent",
  lease: "rent",
  housing: "rent",
  
  // Household
  toilet: "household_supplies",
  paper: "household_supplies",
  soap: "household_supplies",
  cleaning: "household_supplies",
  detergent: "household_supplies",
  
  // Meals
  dinner: "shared_meals",
  lunch: "shared_meals",
  breakfast: "shared_meals",
  restaurant: "shared_meals",
  takeout: "shared_meals",
  delivery: "shared_meals",
  zomato: "shared_meals",
  swiggy: "shared_meals",
  ubereats: "shared_meals",
  doordash: "shared_meals",
  
  // Purchases
  amazon: "purchases",
  flipkart: "purchases",
  ebay: "purchases",
  purchase: "purchases",
  order: "purchases",
};

export const useSmartDefaults = () => {
  const [lastSplitType, setLastSplitTypeState] = useState<SplitType>("equal");
  const [expenseHistory, setExpenseHistory] = useState<ExpenseHistory[]>([]);
  const [categoryCorrections, setCategoryCorrections] = useState<CategoryCorrection[]>([]);
  const [lastExpense, setLastExpenseState] = useState<ExpenseHistory | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedSplitType = localStorage.getItem(STORAGE_KEYS.lastSplitType);
    if (savedSplitType) {
      setLastSplitTypeState(savedSplitType as SplitType);
    }

    const savedHistory = localStorage.getItem(STORAGE_KEYS.expenseHistory);
    if (savedHistory) {
      try {
        setExpenseHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse expense history");
      }
    }

    const savedCorrections = localStorage.getItem(STORAGE_KEYS.categoryCorrections);
    if (savedCorrections) {
      try {
        setCategoryCorrections(JSON.parse(savedCorrections));
      } catch (e) {
        console.error("Failed to parse category corrections");
      }
    }

    const savedLastExpense = localStorage.getItem(STORAGE_KEYS.lastExpense);
    if (savedLastExpense) {
      try {
        setLastExpenseState(JSON.parse(savedLastExpense));
      } catch (e) {
        console.error("Failed to parse last expense");
      }
    }
  }, []);

  // Save last split type
  const setLastSplitType = useCallback((splitType: SplitType) => {
    setLastSplitTypeState(splitType);
    localStorage.setItem(STORAGE_KEYS.lastSplitType, splitType);
  }, []);

  // Record expense for history and suggestions
  const recordExpense = useCallback((expense: ExpenseHistory) => {
    setLastExpenseState(expense);
    localStorage.setItem(STORAGE_KEYS.lastExpense, JSON.stringify(expense));

    setExpenseHistory((prev) => {
      // Keep only last 50 expenses, prioritize unique descriptions
      const filtered = prev.filter(
        (e) => e.description.toLowerCase() !== expense.description.toLowerCase()
      );
      const updated = [expense, ...filtered].slice(0, 50);
      localStorage.setItem(STORAGE_KEYS.expenseHistory, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Record category correction for learning
  const recordCategoryCorrection = useCallback(
    (description: string, category: ExpenseCategory) => {
      // Extract significant keywords (3+ chars)
      const words = description.toLowerCase().split(/\s+/);
      const significantWords = words.filter((w) => w.length >= 3);

      if (significantWords.length === 0) return;

      // Use the first significant word as keyword
      const keyword = significantWords[0];

      setCategoryCorrections((prev) => {
        const filtered = prev.filter((c) => c.keyword !== keyword);
        const updated = [{ keyword, category }, ...filtered].slice(0, 100);
        localStorage.setItem(STORAGE_KEYS.categoryCorrections, JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  // Smart categorization with learning
  const smartCategorize = useCallback(
    (description: string): ExpenseCategory => {
      const lower = description.toLowerCase();

      // First check user corrections (highest priority)
      for (const correction of categoryCorrections) {
        if (lower.includes(correction.keyword)) {
          return correction.category;
        }
      }

      // Then check default mappings
      for (const [keyword, category] of Object.entries(DEFAULT_KEYWORD_MAPPINGS)) {
        if (lower.includes(keyword)) {
          return category;
        }
      }

      return "other";
    },
    [categoryCorrections]
  );

  // Get suggestion based on description
  const getSuggestion = useCallback(
    (description: string): ExpenseHistory | null => {
      if (description.length < 2) return null;

      const lower = description.toLowerCase();
      return (
        expenseHistory.find((e) =>
          e.description.toLowerCase().startsWith(lower)
        ) || null
      );
    },
    [expenseHistory]
  );

  return {
    lastSplitType,
    setLastSplitType,
    lastExpense,
    recordExpense,
    recordCategoryCorrection,
    smartCategorize,
    getSuggestion,
  };
};
