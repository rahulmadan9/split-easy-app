import { Timestamp } from 'firebase/firestore';

/**
 * Split type options for expenses
 */
export type SplitType = 'equal' | 'custom' | 'one_owes_all';

/**
 * Expense category options
 */
export type ExpenseCategory =
  | 'rent'
  | 'utilities'
  | 'groceries'
  | 'household_supplies'
  | 'shared_meals'
  | 'purchases'
  | 'other';

/**
 * Group member role
 */
export type GroupRole = 'admin' | 'member';

/**
 * Group document in Firestore (groups collection)
 */
export interface FirebaseGroup {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  createdByName: string;
  isPersonal: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Group member document in Firestore (groups/{groupId}/members/{userId})
 */
export interface FirebaseGroupMember {
  userId: string;
  userName: string;
  role: GroupRole;
  joinedAt: Timestamp;
}

/**
 * Participant in an expense split
 */
export interface ExpenseParticipant {
  userId: string;
  userName: string;
  amount: number;
}

/**
 * User profile in Firestore
 */
export interface FirebaseProfile {
  id: string;
  displayName: string;
  phoneNumber?: string;
  personalGroupId: string;
  currentGroupId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Expense document in Firestore
 */
export interface FirebaseExpense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidBy: string;
  paidByName: string;
  splitType: SplitType;
  participants: ExpenseParticipant[];
  category: ExpenseCategory;
  expenseDate: string;
  notes: string | null;
  isPayment: boolean;
  isSettlement: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Input type for creating a new expense
 */
export interface CreateExpenseInput {
  groupId: string;
  description: string;
  amount: number;
  paidBy: string;
  splitType: SplitType;
  participants: ExpenseParticipant[];
  category: ExpenseCategory;
  expenseDate: string;
  notes?: string | null;
  isPayment?: boolean;
  isSettlement?: boolean;
}

/**
 * Recurring expense type
 */
export type RecurringExpenseType = 'shared' | 'personal';

/**
 * Recurring expense template in Firestore
 */
export interface FirebaseRecurringExpense {
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
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Confirmation record for a recurring expense in a given month
 */
export interface FirebaseRecurringConfirmation {
  id: string;
  groupId: string;
  recurringExpenseId: string;
  monthKey: string;
  confirmedAmount: number;
  confirmedBy: string;
  confirmedByName: string;
  expenseId: string;
  confirmedAt: Timestamp;
}

/**
 * Simplified debt between two users
 */
export interface SimplifiedDebt {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
}
