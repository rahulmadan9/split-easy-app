import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import type { Expense } from "@/hooks/useGroupExpenses";

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function exportExpensesToCsv(
  expenses: Expense[],
  monthLabel: string
): Promise<void> {
  const headers = [
    "Date",
    "Description",
    "Category",
    "Amount",
    "Paid By",
    "Split Type",
    "Is Settlement",
    "Notes",
  ];

  const rows = expenses.map((e) => [
    e.expense_date,
    escapeCsv(e.description),
    e.category,
    e.amount.toString(),
    escapeCsv(e.paid_by_name),
    e.split_type,
    e.is_settlement ? "Yes" : "No",
    escapeCsv(e.notes || ""),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  const fileName = `expenses-${monthLabel}.csv`;
  const file = new File(Paths.cache, fileName);
  file.write(csv);

  await Sharing.shareAsync(file.uri, {
    mimeType: "text/csv",
    dialogTitle: `Export expenses for ${monthLabel}`,
    UTI: "public.comma-separated-values-text",
  });
}
