import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TablePaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function TablePagination({ page, totalPages, onPageChange, className }: TablePaginationProps) {
  if (totalPages <= 1) return null;

  const go = (p: number) => {
    onPageChange(Math.min(totalPages, Math.max(1, p)));
  };

  const windowRadius = 2;
  let start = Math.max(1, page - windowRadius);
  let end = Math.min(totalPages, page + windowRadius);

  if (end - start < 4) {
    if (start === 1) end = Math.min(totalPages, start + 4);
    else start = Math.max(1, end - 4);
  }

  const middle: number[] = [];
  for (let p = start; p <= end; p++) middle.push(p);

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-2", className)}>
      <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => go(page - 1)}>
        Previous
      </Button>

      {start > 1 && (
        <>
          <Button
            type="button"
            variant={page === 1 ? "default" : "outline"}
            size="sm"
            className="h-8 min-w-8 px-2"
            onClick={() => go(1)}
          >
            1
          </Button>
          {start > 2 && <span className="px-1 text-xs text-muted-foreground">…</span>}
        </>
      )}

      {middle.map((p) => (
        <Button
          key={p}
          type="button"
          variant={p === page ? "default" : "outline"}
          size="sm"
          className="h-8 min-w-8 px-2"
          onClick={() => go(p)}
        >
          {p}
        </Button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-xs text-muted-foreground">…</span>}
          <Button
            type="button"
            variant={page === totalPages ? "default" : "outline"}
            size="sm"
            className="h-8 min-w-8 px-2"
            onClick={() => go(totalPages)}
          >
            {totalPages}
          </Button>
        </>
      )}

      <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => go(page + 1)}>
        Next
      </Button>
    </div>
  );
}
