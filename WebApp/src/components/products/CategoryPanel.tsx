import { Category } from "@/lib/types";
import { CategoryCount } from "@/lib/hooks/useCategoryCounts";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

interface Props {
  categories: Category[];
  counts: Map<number, CategoryCount>;
  grandTotal: number;
  selectedId: number | undefined;
  onSelect: (id: number | undefined) => void;
}

export default function CategoryPanel({ categories, counts, grandTotal, selectedId, onSelect }: Props) {
  return (
    <div className="glass w-full shrink-0 rounded-2xl p-4 lg:w-72">
      <h2 className="mb-3 px-1 text-sm font-bold text-slate-900">หมวดหมู่</h2>
      <div className="space-y-1.5">
        <button
          type="button"
          aria-pressed={selectedId === undefined}
          onClick={() => onSelect(undefined)}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors",
            selectedId === undefined ? "bg-white/75 text-primary shadow-sm shadow-indigo-950/10" : "text-slate-600 hover:bg-white/50"
          )}
        >
          <span>ทั้งหมด</span>
          <span className="text-xs font-medium text-slate-400">{grandTotal} รายการ</span>
        </button>

        {categories.map((cat) => {
          const count = counts.get(cat.id) ?? { total: 0, activeCount: 0 };
          const active = selectedId === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(cat.id)}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition-colors",
                active ? "bg-white/75 shadow-sm shadow-indigo-950/10" : "hover:bg-white/50"
              )}
            >
              <div className="min-w-0">
                <p className={cn("truncate text-sm font-semibold", active ? "text-primary" : "text-slate-800")}>{cat.name}</p>
                <p className="text-xs text-slate-400">{count.total} รายการ</p>
              </div>
              <Badge variant={count.activeCount > 0 ? "success" : "secondary"} className="shrink-0">
                {count.activeCount > 0 ? "Active" : "Inactive"}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}
