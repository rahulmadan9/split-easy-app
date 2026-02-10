import { ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, subMonths } from "date-fns";

interface MonthSelectorProps {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
}

const MonthSelector = ({ selectedMonth, onMonthChange }: MonthSelectorProps) => {
  // Generate last 12 months
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: `${date.getFullYear()}-${date.getMonth()}`,
      label: format(date, "MMMM yyyy"),
      date,
    };
  });

  const currentValue = `${selectedMonth.getFullYear()}-${selectedMonth.getMonth()}`;

  return (
    <Select
      value={currentValue}
      onValueChange={(value) => {
        const [year, month] = value.split("-").map(Number);
        onMonthChange(new Date(year, month, 1));
      }}
    >
      <SelectTrigger className="w-[180px] h-10">
        <SelectValue placeholder="Select month" />
      </SelectTrigger>
      <SelectContent>
        {months.map((month) => (
          <SelectItem key={month.value} value={month.value}>
            {month.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default MonthSelector;
