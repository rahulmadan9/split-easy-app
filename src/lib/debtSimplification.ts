import type { SimplifiedDebt, ExpenseParticipant } from "@/integrations/firebase/types";

interface ExpenseForBalance {
  amount: number;
  paidBy: string;
  participants: ExpenseParticipant[];
  isSettlement: boolean;
}

interface GroupMember {
  userId: string;
  userName: string;
}

/**
 * Calculate net balance per user from all non-settlement expenses.
 * Positive = owed money (creditor), Negative = owes money (debtor).
 */
export function calculateNetBalances(
  expenses: ExpenseForBalance[],
  members: GroupMember[]
): Map<string, number> {
  const balances = new Map<string, number>();

  // Initialize all members to 0
  for (const member of members) {
    balances.set(member.userId, 0);
  }

  for (const expense of expenses) {
    const payer = expense.paidBy;
    const totalParticipantAmount = expense.participants.reduce((sum, p) => sum + p.amount, 0);

    // Payer is owed the total participant amount (they paid for everyone)
    balances.set(payer, (balances.get(payer) || 0) + totalParticipantAmount);

    // Each participant owes their share
    for (const participant of expense.participants) {
      balances.set(
        participant.userId,
        (balances.get(participant.userId) || 0) - participant.amount
      );
    }
  }

  return balances;
}

/**
 * Simplify debts using greedy algorithm.
 * Takes net balances and returns minimum set of transactions to settle all debts.
 */
export function simplifyDebts(
  balances: Map<string, number>,
  memberNames: Map<string, string>
): SimplifiedDebt[] {
  // Separate into creditors and debtors, filtering out zero/near-zero balances
  const creditors: { userId: string; amount: number }[] = [];
  const debtors: { userId: string; amount: number }[] = [];

  for (const [userId, balance] of balances) {
    if (balance > 0.01) {
      creditors.push({ userId, amount: balance });
    } else if (balance < -0.01) {
      debtors.push({ userId, amount: Math.abs(balance) });
    }
  }

  // Sort both by amount descending (greedy: settle largest first)
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const debts: SimplifiedDebt[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];
    const settleAmount = Math.min(creditor.amount, debtor.amount);

    if (settleAmount > 0.01) {
      debts.push({
        from: debtor.userId,
        fromName: memberNames.get(debtor.userId) || debtor.userId,
        to: creditor.userId,
        toName: memberNames.get(creditor.userId) || creditor.userId,
        amount: Math.round(settleAmount * 100) / 100,
      });
    }

    creditor.amount -= settleAmount;
    debtor.amount -= settleAmount;

    if (creditor.amount < 0.01) ci++;
    if (debtor.amount < 0.01) di++;
  }

  return debts;
}

/**
 * Get settlement suggestions for a group.
 * Computes net balances from expenses, then simplifies debts.
 */
export function getSettlementSuggestions(
  expenses: ExpenseForBalance[],
  members: GroupMember[]
): SimplifiedDebt[] {
  const balances = calculateNetBalances(expenses, members);
  const memberNames = new Map(members.map((m) => [m.userId, m.userName]));
  return simplifyDebts(balances, memberNames);
}

/**
 * Get the balance for a specific user within a group.
 * Positive = others owe you, Negative = you owe others.
 */
export function getUserBalance(
  expenses: ExpenseForBalance[],
  members: GroupMember[],
  userId: string
): number {
  const balances = calculateNetBalances(expenses, members);
  return balances.get(userId) || 0;
}
