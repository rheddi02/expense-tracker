import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";

export default function TransactionItem({
  expense,
  onDelete,
}: {
  expense: any;
  onDelete: (expense: any) => void;
}) {
  return (
    <div className="flex items-center justify-between border p-3 rounded-lg">
      <div>
        <p className="font-medium">{expense.categoryLabel}</p>
        <p className="text-sm text-muted-foreground">
          {expense.amount}
        </p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(expense)}
      >
        <Trash className="w-4 h-4" />
      </Button>
    </div>
  );
}
