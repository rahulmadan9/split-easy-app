import { z } from "zod";

const participantSchema = z.object({
  userId: z.string().min(1, "Invalid user ID"),
  userName: z.string().min(1, "Invalid user name"),
  amount: z.number().min(0, "Participant amount cannot be negative"),
});

/**
 * Expense validation schema for group-based expenses
 */
export const expenseSchema = z.object({
  group_id: z.string().min(1, "Group is required"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(200, "Description must be less than 200 characters")
    .transform((val) => val.trim()),
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .max(1000000, "Amount cannot exceed ₹10,00,000"),
  paid_by: z.string().min(1, "Invalid payer"),
  split_type: z.enum(["equal", "custom", "one_owes_all"], {
    errorMap: () => ({ message: "Invalid split type" }),
  }),
  participants: z
    .array(participantSchema)
    .min(1, "At least one participant is required"),
  category: z.enum(
    ["rent", "utilities", "groceries", "household_supplies", "shared_meals", "purchases", "other"],
    { errorMap: () => ({ message: "Invalid category" }) }
  ),
  expense_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  notes: z
    .string()
    .max(1000, "Notes must be less than 1000 characters")
    .nullable()
    .optional()
    .transform((val) => (val ? val.trim() : val)),
  is_payment: z.boolean().optional().default(false),
  is_settlement: z.boolean().optional().default(false),
});

export const expenseSchemaWithRefinement = expenseSchema
  .refine(
    (data) => {
      // Validate participant amounts sum to total for custom splits
      if (data.split_type === "custom") {
        const sum = data.participants.reduce((acc, p) => acc + p.amount, 0);
        return Math.abs(sum - data.amount) < 0.01;
      }
      return true;
    },
    {
      message: "Participant amounts must equal the total expense amount",
      path: ["participants"],
    }
  )
  .refine(
    (data) => {
      const date = new Date(data.expense_date);
      const minDate = new Date("2000-01-01");
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 1);
      return date >= minDate && date <= maxDate;
    },
    {
      message: "Date must be between year 2000 and one year from now",
      path: ["expense_date"],
    }
  );

/**
 * Settlement validation schema
 */
export const settlementSchema = z.object({
  group_id: z.string().min(1, "Group is required"),
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .max(1000000, "Amount cannot exceed ₹10,00,000"),
  paid_by: z.string().min(1, "Invalid payer"),
  paid_to: z.string().min(1, "Invalid recipient"),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

export type ExpenseInput = z.infer<typeof expenseSchemaWithRefinement>;
export type SettlementInput = z.infer<typeof settlementSchema>;

/**
 * Group validation schema
 */
export const groupSchema = z.object({
  name: z
    .string()
    .min(1, "Group name is required")
    .max(50, "Group name must be less than 50 characters")
    .transform((val) => val.trim()),
});

export type GroupInput = z.infer<typeof groupSchema>;

/**
 * Recurring expense template validation schema
 */
export const recurringExpenseSchema = z.object({
  group_id: z.string().min(1, "Group is required"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(200, "Description must be less than 200 characters")
    .transform((val) => val.trim()),
  default_amount: z
    .number()
    .positive("Amount must be greater than 0")
    .max(1000000, "Amount cannot exceed ₹10,00,000"),
  expense_type: z.enum(["shared", "personal"], {
    errorMap: () => ({ message: "Invalid expense type" }),
  }),
  category: z.enum(
    ["rent", "utilities", "groceries", "household_supplies", "shared_meals", "purchases", "other"],
    { errorMap: () => ({ message: "Invalid category" }) }
  ),
  split_type: z.enum(["equal", "custom", "one_owes_all"], {
    errorMap: () => ({ message: "Invalid split type" }),
  }),
  participants: z.array(participantSchema).min(1, "At least one participant is required"),
  typically_paid_by: z.string().min(1, "Payer is required"),
});

export const recurringExpenseSchemaWithRefinement = recurringExpenseSchema.refine(
  (data) => {
    if (data.split_type === "custom") {
      const sum = data.participants.reduce((acc, p) => acc + p.amount, 0);
      return Math.abs(sum - data.default_amount) < 0.01;
    }
    return true;
  },
  {
    message: "Participant amounts must equal the default amount",
    path: ["participants"],
  }
);

/**
 * Recurring confirmation validation schema (amount only)
 */
export const recurringConfirmSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .max(1000000, "Amount cannot exceed ₹10,00,000"),
});

export type RecurringExpenseInput = z.infer<typeof recurringExpenseSchemaWithRefinement>;
export type RecurringConfirmInput = z.infer<typeof recurringConfirmSchema>;

/**
 * Validates expense data
 */
export const validateExpense = (
  data: unknown
): { success: true; data: ExpenseInput } | { success: false; error: string } => {
  try {
    const validated = expenseSchemaWithRefinement.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Invalid expense data" };
    }
    return { success: false, error: "Invalid expense data" };
  }
};

/**
 * Validates settlement data
 */
export const validateSettlement = (
  data: unknown
): { success: true; data: SettlementInput } | { success: false; error: string } => {
  try {
    const validated = settlementSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Invalid settlement data" };
    }
    return { success: false, error: "Invalid settlement data" };
  }
};

/**
 * Validates group data
 */
export const validateGroup = (
  data: unknown
): { success: true; data: GroupInput } | { success: false; error: string } => {
  try {
    const validated = groupSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Invalid group data" };
    }
    return { success: false, error: "Invalid group data" };
  }
};

/**
 * Validates recurring expense template data
 */
export const validateRecurringExpense = (
  data: unknown
): { success: true; data: RecurringExpenseInput } | { success: false; error: string } => {
  try {
    const validated = recurringExpenseSchemaWithRefinement.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Invalid recurring expense data" };
    }
    return { success: false, error: "Invalid recurring expense data" };
  }
};

/**
 * Validates recurring confirmation amount
 */
export const validateRecurringConfirm = (
  data: unknown
): { success: true; data: RecurringConfirmInput } | { success: false; error: string } => {
  try {
    const validated = recurringConfirmSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Invalid confirmation data" };
    }
    return { success: false, error: "Invalid confirmation data" };
  }
};
