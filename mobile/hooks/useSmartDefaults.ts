import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

const DEFAULT_KEYWORD_MAPPINGS: Record<string, ExpenseCategory> = {
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
  "pg&e": "utilities",
  pge: "utilities",
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
  rent: "rent",
  lease: "rent",
  housing: "rent",
  toilet: "household_supplies",
  paper: "household_supplies",
  soap: "household_supplies",
  cleaning: "household_supplies",
  detergent: "household_supplies",
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

  useEffect(() => {
    const loadFromStorage = async () => {
      try {
        const savedSplitType = await AsyncStorage.getItem(STORAGE_KEYS.lastSplitType);
        if (savedSplitType) setLastSplitTypeState(savedSplitType as SplitType);

        const savedHistory = await AsyncStorage.getItem(STORAGE_KEYS.expenseHistory);
        if (savedHistory) setExpenseHistory(JSON.parse(savedHistory));

        const savedCorrections = await AsyncStorage.getItem(STORAGE_KEYS.categoryCorrections);
        if (savedCorrections) setCategoryCorrections(JSON.parse(savedCorrections));

        const savedLastExpense = await AsyncStorage.getItem(STORAGE_KEYS.lastExpense);
        if (savedLastExpense) setLastExpenseState(JSON.parse(savedLastExpense));
      } catch (e) {
        console.error("Failed to load smart defaults from storage");
      }
    };
    loadFromStorage();
  }, []);

  const setLastSplitType = useCallback((splitType: SplitType) => {
    setLastSplitTypeState(splitType);
    AsyncStorage.setItem(STORAGE_KEYS.lastSplitType, splitType);
  }, []);

  const recordExpense = useCallback((expense: ExpenseHistory) => {
    setLastExpenseState(expense);
    AsyncStorage.setItem(STORAGE_KEYS.lastExpense, JSON.stringify(expense));

    setExpenseHistory((prev) => {
      const filtered = prev.filter(
        (e) => e.description.toLowerCase() !== expense.description.toLowerCase()
      );
      const updated = [expense, ...filtered].slice(0, 50);
      AsyncStorage.setItem(STORAGE_KEYS.expenseHistory, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const recordCategoryCorrection = useCallback(
    (description: string, category: ExpenseCategory) => {
      const words = description.toLowerCase().split(/\s+/);
      const significantWords = words.filter((w) => w.length >= 3);
      if (significantWords.length === 0) return;

      const keyword = significantWords[0];

      setCategoryCorrections((prev) => {
        const filtered = prev.filter((c) => c.keyword !== keyword);
        const updated = [{ keyword, category }, ...filtered].slice(0, 100);
        AsyncStorage.setItem(STORAGE_KEYS.categoryCorrections, JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  const smartCategorize = useCallback(
    (description: string): ExpenseCategory => {
      const lower = description.toLowerCase();

      for (const correction of categoryCorrections) {
        if (lower.includes(correction.keyword)) {
          return correction.category;
        }
      }

      for (const [keyword, category] of Object.entries(DEFAULT_KEYWORD_MAPPINGS)) {
        if (lower.includes(keyword)) {
          return category;
        }
      }

      return "other";
    },
    [categoryCorrections]
  );

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
