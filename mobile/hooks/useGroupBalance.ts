import { useMemo } from "react";
import { useGroupExpenses } from "./useGroupExpenses";
import { useGroupMembers } from "./useGroupMembers";
import { useAuth } from "./useAuth";
import {
  calculateNetBalances,
  getSettlementSuggestions,
} from "../../shared/lib/debtSimplification";
import type { SimplifiedDebt } from "../../shared/types/firebase";

export const useGroupBalance = (groupId: string | null) => {
  const { user } = useAuth();
  const { expenses, loading: expensesLoading } = useGroupExpenses(groupId);
  const { members, loading: membersLoading } = useGroupMembers(groupId);

  const loading = expensesLoading || membersLoading;

  const expensesForBalance = useMemo(() => {
    return expenses.map((e) => ({
      amount: e.amount,
      paidBy: e.paid_by,
      participants: e.participants,
      isSettlement: e.is_settlement,
    }));
  }, [expenses]);

  const membersForBalance = useMemo(() => {
    return members.map((m) => ({
      userId: m.userId,
      userName: m.userName,
    }));
  }, [members]);

  const balances = useMemo(() => {
    if (!groupId || members.length === 0) return new Map<string, number>();
    return calculateNetBalances(expensesForBalance, membersForBalance);
  }, [groupId, expensesForBalance, membersForBalance]);

  const settlements: SimplifiedDebt[] = useMemo(() => {
    if (!groupId || members.length === 0) return [];
    return getSettlementSuggestions(expensesForBalance, membersForBalance);
  }, [groupId, expensesForBalance, membersForBalance]);

  const myBalance = user ? (balances.get(user.uid) || 0) : 0;

  return {
    balances,
    settlements,
    myBalance,
    loading,
  };
};
