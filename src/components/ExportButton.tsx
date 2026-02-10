import { Expense } from "@/hooks/useExpenses";
import { format } from "date-fns";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ExportButtonProps {
  expenses: Expense[];
  monthLabel: string;
}

const ExportButton = ({ expenses, monthLabel }: ExportButtonProps) => {
  const exportToCsv = () => {
    if (expenses.length === 0) {
      toast.error("No expenses to export");
      return;
    }

    const headers = [
      "Date",
      "Description",
      "Category",
      "Amount",
      "Paid By",
      "Split Type",
      "Custom Amount",
      "Is Payment",
      "Notes",
    ];

    const rows = expenses.map((exp) => [
      format(new Date(exp.expense_date), "yyyy-MM-dd"),
      `"${exp.description.replace(/"/g, '""')}"`,
      exp.category,
      exp.amount,
      exp.payer?.display_name || "Unknown",
      exp.split_type,
      exp.custom_split_amount || "",
      exp.is_payment ? "Yes" : "No",
      exp.notes ? `"${exp.notes.replace(/"/g, '""')}"` : "",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
      "\n"
    );

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `expenses-${monthLabel.toLowerCase().replace(" ", "-")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Expenses exported!");
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={exportToCsv}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  );
};

export default ExportButton;
