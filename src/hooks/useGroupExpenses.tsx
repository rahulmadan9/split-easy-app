import { useEffect, useState, useCallback } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/integrations/firebase/config";
import { useAuth } from "./useAuth";
import { useGroupMembers } from "./useGroupMembers";
import { validateExpense } from "@/lib/validation";
import type { ExpenseParticipant, SplitType, ExpenseCategory } from "@/integrations/firebase/types";

export interface Expense {
  id: string;
  groupId: string;
  amount: number;
  category: string;
  created_at: string;
  description: string;
  expense_date: string;
  is_payment: boolean;
  is_settlement: boolean;
  notes: string | null;
  paid_by: string;
  paid_by_name: string;
  split_type: SplitType;
  participants: ExpenseParticipant[];
  updated_at: string;
}

export interface ExpenseInsert {
  groupId: string;
  amount: number;
  category?: string;
  description: string;
  expense_date?: string;
  is_payment?: boolean;
  is_settlement?: boolean;
  notes?: string | null;
  paid_by: string;
  split_type?: SplitType;
  participants: ExpenseParticipant[];
}

export const useGroupExpenses = (groupId: string | null) => {
  const { user } = useAuth();
  const { members } = useGroupMembers(groupId);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !groupId) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    // Single query by groupId - no dual-query needed
    const expensesQuery = query(
      collection(db, "expenses"),
      where("groupId", "==", groupId),
      orderBy("expenseDate", "desc"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      expensesQuery,
      (snapshot) => {
        const expensesData: Expense[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            groupId: data.groupId || "",
            amount: data.amount || 0,
            category: data.category || "other",
            created_at:
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate().toISOString()
                : new Date().toISOString(),
            description: data.description || "",
            expense_date: data.expenseDate || new Date().toISOString().split("T")[0],
            is_payment: data.isPayment === true,
            is_settlement: data.isSettlement === true,
            notes: data.notes ?? null,
            paid_by: data.paidBy || "",
            paid_by_name: data.paidByName || "",
            split_type: data.splitType || "equal",
            participants: data.participants || [],
            updated_at:
              data.updatedAt instanceof Timestamp
                ? data.updatedAt.toDate().toISOString()
                : new Date().toISOString(),
          };
        });
        setExpenses(expensesData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching expenses", error);
        toast.error("Failed to load expenses. Check your connection.");
        setExpenses([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, groupId]);

  const addExpense = useCallback(
    async (expense: ExpenseInsert) => {
      if (!user || !groupId) throw new Error("Not logged in or no group selected");

      const paidByMember = members.find((m) => m.userId === expense.paid_by);
      const paidByName = paidByMember?.userName || "";

      const dataToValidate = {
        group_id: groupId,
        description: expense.description,
        amount: Number(expense.amount),
        paid_by: expense.paid_by,
        split_type: expense.split_type || "equal",
        participants: expense.participants,
        category: expense.category || "other",
        expense_date: expense.expense_date || new Date().toISOString().split("T")[0],
        notes: expense.notes || null,
        is_payment: expense.is_payment || false,
        is_settlement: expense.is_settlement || false,
      };

      if (!expense.is_payment && !expense.is_settlement) {
        const result = validateExpense(dataToValidate);
        if (result.success === false) throw new Error(result.error);
      }

      const firestoreData = {
        groupId,
        description: expense.description,
        amount: Number(expense.amount),
        paidBy: expense.paid_by,
        paidByName,
        splitType: expense.split_type || "equal",
        participants: expense.participants,
        category: expense.category || "other",
        expenseDate: expense.expense_date || new Date().toISOString().split("T")[0],
        notes: expense.notes || null,
        isPayment: expense.is_payment === true,
        isSettlement: expense.is_settlement === true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "expenses"), firestoreData);
    },
    [user, groupId, members]
  );

  const deleteExpense = useCallback(
    async (expenseId: string) => {
      await deleteDoc(doc(db, "expenses", expenseId));
    },
    []
  );

  const updateExpense = useCallback(
    async (expenseId: string, expense: Partial<ExpenseInsert>) => {
      if (!user || !groupId) throw new Error("Not logged in or no group selected");

      const updateData: Record<string, any> = { updatedAt: serverTimestamp() };

      if (expense.description !== undefined) updateData.description = expense.description;
      if (expense.amount !== undefined) updateData.amount = Number(expense.amount);
      if (expense.paid_by !== undefined) {
        updateData.paidBy = expense.paid_by;
        const paidByMember = members.find((m) => m.userId === expense.paid_by);
        updateData.paidByName = paidByMember?.userName || "";
      }
      if (expense.split_type !== undefined) updateData.splitType = expense.split_type;
      if (expense.participants !== undefined) updateData.participants = expense.participants;
      if (expense.category !== undefined) updateData.category = expense.category;
      if (expense.expense_date !== undefined) updateData.expenseDate = expense.expense_date;
      if (expense.notes !== undefined) updateData.notes = expense.notes;

      if (expense.description && expense.amount) {
        const dataToValidate = {
          group_id: groupId,
          description: expense.description,
          amount: Number(expense.amount),
          paid_by: expense.paid_by || "",
          split_type: expense.split_type || "equal",
          participants: expense.participants || [],
          category: expense.category || "other",
          expense_date: expense.expense_date || new Date().toISOString().split("T")[0],
          notes: expense.notes || null,
          is_payment: false,
          is_settlement: false,
        };
        const result = validateExpense(dataToValidate);
        if (result.success === false) throw new Error(result.error);
      }

      await updateDoc(doc(db, "expenses", expenseId), updateData);
    },
    [user, groupId, members]
  );

  return {
    expenses,
    loading,
    addExpense,
    deleteExpense,
    updateExpense,
  };
};
