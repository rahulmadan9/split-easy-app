import { useEffect, useState, useCallback, useMemo } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/config";
import { useAuth } from "./useAuth";
import { useProfiles } from "./useProfiles";
import { useGroupMembers } from "./useGroupMembers";
import { validateRecurringConfirm } from "@/lib/validation";
import type { SplitType, ExpenseCategory, ExpenseParticipant, RecurringExpenseType } from "@/integrations/firebase/types";

export interface RecurringExpense {
  id: string;
  groupId: string;
  description: string;
  defaultAmount: number;
  category: ExpenseCategory;
  expenseType: RecurringExpenseType;
  splitType: SplitType;
  participants: ExpenseParticipant[];
  typicallyPaidBy: string;
  typicallyPaidByName: string;
  createdBy: string;
  createdByName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringConfirmation {
  id: string;
  recurringExpenseId: string;
  monthKey: string;
  confirmedAmount: number;
  confirmedBy: string;
  confirmedByName: string;
  expenseId: string;
  confirmedAt: string;
}

export interface RecurringItemWithStatus extends RecurringExpense {
  confirmation: RecurringConfirmation | null;
  isPending: boolean;
}

export interface RecurringSummary {
  totalFixed: number;
  paidSoFar: number;
  remaining: number;
}

export interface RecurringExpenseInsert {
  description: string;
  defaultAmount: number;
  category: ExpenseCategory;
  expenseType: RecurringExpenseType;
  splitType: SplitType;
  participants: ExpenseParticipant[];
  typicallyPaidBy: string;
}

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export const useRecurringExpenses = (groupId: string | null) => {
  const { user } = useAuth();
  const { currentProfile } = useProfiles();
  const { members } = useGroupMembers(groupId);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [confirmations, setConfirmations] = useState<RecurringConfirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthKey] = useState(getCurrentMonthKey);

  useEffect(() => {
    if (!user || !groupId) {
      setRecurringExpenses([]);
      setConfirmations([]);
      setLoading(false);
      return;
    }

    const processDoc = (docSnap: any): RecurringExpense => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        groupId: data.groupId || "",
        description: data.description || "",
        defaultAmount: data.defaultAmount || 0,
        category: data.category || "other",
        expenseType: data.expenseType || "shared",
        splitType: data.splitType || "equal",
        participants: data.participants || [],
        typicallyPaidBy: data.typicallyPaidBy || "",
        typicallyPaidByName: data.typicallyPaidByName || "",
        createdBy: data.createdBy || "",
        createdByName: data.createdByName || "",
        isActive: data.isActive !== false,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : new Date().toISOString(),
        updatedAt:
          data.updatedAt instanceof Timestamp
            ? data.updatedAt.toDate().toISOString()
            : new Date().toISOString(),
      };
    };

    // Single query by groupId + isActive
    const recurringQuery = query(
      collection(db, "recurringExpenses"),
      where("groupId", "==", groupId),
      where("isActive", "==", true),
      orderBy("createdAt", "asc")
    );

    const confirmationsQuery = query(
      collection(db, "recurringConfirmations"),
      where("groupId", "==", groupId),
      where("monthKey", "==", monthKey)
    );

    const unsubRecurring = onSnapshot(
      recurringQuery,
      (snapshot) => {
        setRecurringExpenses(snapshot.docs.map(processDoc));
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching recurring expenses", error);
        setRecurringExpenses([]);
        setLoading(false);
      }
    );

    const unsubConfirmations = onSnapshot(
      confirmationsQuery,
      (snapshot) => {
        const confs: RecurringConfirmation[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            recurringExpenseId: data.recurringExpenseId || "",
            monthKey: data.monthKey || "",
            confirmedAmount: data.confirmedAmount || 0,
            confirmedBy: data.confirmedBy || "",
            confirmedByName: data.confirmedByName || "",
            expenseId: data.expenseId || "",
            confirmedAt:
              data.confirmedAt instanceof Timestamp
                ? data.confirmedAt.toDate().toISOString()
                : new Date().toISOString(),
          };
        });
        setConfirmations(confs);
      },
      (error) => {
        console.error("Error fetching recurring confirmations", error);
        setConfirmations([]);
      }
    );

    return () => {
      unsubRecurring();
      unsubConfirmations();
    };
  }, [user, groupId, monthKey]);

  const itemsWithStatus = useMemo((): RecurringItemWithStatus[] => {
    return recurringExpenses.map((item) => {
      const confirmation =
        confirmations.find((c) => c.recurringExpenseId === item.id) || null;
      return { ...item, confirmation, isPending: !confirmation };
    });
  }, [recurringExpenses, confirmations]);

  const pendingItems = useMemo(
    () => itemsWithStatus.filter((i) => i.isPending),
    [itemsWithStatus]
  );

  const confirmedItems = useMemo(
    () => itemsWithStatus.filter((i) => !i.isPending),
    [itemsWithStatus]
  );

  const summary = useMemo((): RecurringSummary => {
    const totalFixed = recurringExpenses.reduce((sum, item) => sum + item.defaultAmount, 0);
    const paidSoFar = confirmedItems.reduce(
      (sum, item) => sum + (item.confirmation?.confirmedAmount || 0),
      0
    );
    return { totalFixed, paidSoFar, remaining: totalFixed - paidSoFar };
  }, [recurringExpenses, confirmedItems]);

  const addRecurringExpense = useCallback(
    async (input: RecurringExpenseInsert) => {
      if (!currentProfile || !groupId) throw new Error("Not logged in or no group");

      const paidByMember = members.find((m) => m.userId === input.typicallyPaidBy);

      const firestoreData = {
        groupId,
        description: input.description,
        defaultAmount: Number(input.defaultAmount),
        category: input.category,
        expenseType: input.expenseType,
        splitType: input.splitType,
        participants: input.participants,
        typicallyPaidBy: input.typicallyPaidBy,
        typicallyPaidByName: paidByMember?.userName || "",
        createdBy: currentProfile.id,
        createdByName: currentProfile.display_name,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "recurringExpenses"), firestoreData);
    },
    [currentProfile, groupId, members]
  );

  const updateRecurringExpense = useCallback(
    async (id: string, input: Partial<RecurringExpenseInsert>) => {
      const updateData: Record<string, any> = { updatedAt: serverTimestamp() };

      if (input.description !== undefined) updateData.description = input.description;
      if (input.defaultAmount !== undefined) updateData.defaultAmount = Number(input.defaultAmount);
      if (input.category !== undefined) updateData.category = input.category;
      if (input.expenseType !== undefined) updateData.expenseType = input.expenseType;
      if (input.splitType !== undefined) updateData.splitType = input.splitType;
      if (input.participants !== undefined) updateData.participants = input.participants;
      if (input.typicallyPaidBy !== undefined) {
        updateData.typicallyPaidBy = input.typicallyPaidBy;
        const member = members.find((m) => m.userId === input.typicallyPaidBy);
        updateData.typicallyPaidByName = member?.userName || "";
      }

      await updateDoc(doc(db, "recurringExpenses", id), updateData);
    },
    [members]
  );

  const deleteRecurringExpense = useCallback(async (id: string) => {
    await updateDoc(doc(db, "recurringExpenses", id), {
      isActive: false,
      updatedAt: serverTimestamp(),
    });
  }, []);

  const confirmRecurringExpense = useCallback(
    async (recurringExpenseId: string, amount: number) => {
      if (!currentProfile || !groupId) throw new Error("Not logged in");

      const result = validateRecurringConfirm({ amount: Number(amount) });
      if (result.success === false) throw new Error(result.error);

      const item = recurringExpenses.find((r) => r.id === recurringExpenseId);
      if (!item) throw new Error("Recurring expense not found");

      const today = new Date().toISOString().split("T")[0];
      const batch = writeBatch(db);

      const expenseRef = doc(collection(db, "expenses"));
      batch.set(expenseRef, {
        groupId,
        description: item.description,
        amount: Number(amount),
        paidBy: item.typicallyPaidBy,
        paidByName: item.typicallyPaidByName,
        splitType: item.splitType,
        participants: item.participants,
        category: item.category,
        expenseDate: today,
        notes: `Recurring: ${item.description}`,
        isPayment: false,
        isSettlement: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const confirmRef = doc(collection(db, "recurringConfirmations"));
      batch.set(confirmRef, {
        groupId,
        recurringExpenseId,
        monthKey,
        confirmedAmount: Number(amount),
        confirmedBy: currentProfile.id,
        confirmedByName: currentProfile.display_name,
        expenseId: expenseRef.id,
        confirmedAt: serverTimestamp(),
      });

      await batch.commit();
    },
    [currentProfile, groupId, recurringExpenses, monthKey]
  );

  const bulkConfirm = useCallback(
    async (items: { recurringExpenseId: string; amount: number }[]) => {
      if (!currentProfile || !groupId) throw new Error("Not logged in");

      const today = new Date().toISOString().split("T")[0];
      const batch = writeBatch(db);

      for (const { recurringExpenseId, amount } of items) {
        const item = recurringExpenses.find((r) => r.id === recurringExpenseId);
        if (!item) continue;

        const expenseRef = doc(collection(db, "expenses"));
        batch.set(expenseRef, {
          groupId,
          description: item.description,
          amount: Number(amount),
          paidBy: item.typicallyPaidBy,
          paidByName: item.typicallyPaidByName,
          splitType: item.splitType,
          participants: item.participants,
          category: item.category,
          expenseDate: today,
          notes: `Recurring: ${item.description}`,
          isPayment: false,
          isSettlement: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        const confirmRef = doc(collection(db, "recurringConfirmations"));
        batch.set(confirmRef, {
          groupId,
          recurringExpenseId,
          monthKey,
          confirmedAmount: Number(amount),
          confirmedBy: currentProfile.id,
          confirmedByName: currentProfile.display_name,
          expenseId: expenseRef.id,
          confirmedAt: serverTimestamp(),
        });
      }

      await batch.commit();
    },
    [currentProfile, groupId, recurringExpenses, monthKey]
  );

  const undoConfirmation = useCallback(
    async (confirmationId: string) => {
      const conf = confirmations.find((c) => c.id === confirmationId);
      if (!conf) throw new Error("Confirmation not found");

      const batch = writeBatch(db);
      batch.delete(doc(db, "recurringConfirmations", confirmationId));
      batch.delete(doc(db, "expenses", conf.expenseId));
      await batch.commit();
    },
    [confirmations]
  );

  return {
    recurringExpenses,
    confirmations,
    loading,
    monthKey,
    itemsWithStatus,
    pendingItems,
    confirmedItems,
    summary,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    confirmRecurringExpense,
    bulkConfirm,
    undoConfirmation,
  };
};
