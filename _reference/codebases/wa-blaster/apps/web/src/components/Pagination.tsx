interface Props {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (next: number) => void;
}

export default function Pagination({ page, pageSize, total, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between py-3 text-[13px]" data-testid="pagination">
      <div className="text-foreground-muted">{from}–{to} of {total}</div>
      <div className="flex items-center gap-2">
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}
          className="rounded-md border border-border-strong px-3 py-1 text-foreground disabled:opacity-40" data-testid="page-prev">Prev</button>
        <span className="px-2 text-foreground-muted">{page} / {totalPages}</span>
        <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}
          className="rounded-md border border-border-strong px-3 py-1 text-foreground disabled:opacity-40" data-testid="page-next">Next</button>
      </div>
    </div>
  );
}
