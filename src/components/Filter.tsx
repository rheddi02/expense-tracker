import type { CategoryOption } from "@/App";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Props = {
  categories: CategoryOption[];
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
};

export default function ExpenseFilter({ categories, selectedCategory, onCategoryChange }: Props) {
  return (
    <div className="flex mx-1 items-center gap-5">
      {/* Dropdown */}
      <label>Filter:</label>
      <Select onValueChange={onCategoryChange} value={selectedCategory}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="All">All</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.label}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
