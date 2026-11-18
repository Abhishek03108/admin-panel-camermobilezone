import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.totalPages <= 1) return null;
  const { page, totalPages, totalItems } = meta;

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4 border-t border-line text-sm">
      <span className="text-muted">
        Page {page} of {totalPages} &middot; {totalItems} total
      </span>
      <div className="flex gap-1.5">
        <button
          className="btn-secondary !px-3 !py-2"
          disabled={!meta.hasPrevPage}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          className="btn-secondary !px-3 !py-2"
          disabled={!meta.hasNextPage}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
