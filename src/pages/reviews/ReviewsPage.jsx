import { useEffect, useState, useMemo } from "react";
import { 
  Star, 
  Check, 
  X, 
  Trash2, 
  Filter, 
  MessageSquare, 
  CheckCircle2, 
  EyeOff, 
  Loader2, 
  ShoppingBag,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";
import { reviewsApi } from "../../api/reviews.api.js";
import { getErrorMessage } from "../../api/axiosClient.js";
import { useToast } from "../../context/ToastContext.jsx";
import { formatDate } from "../../utils/formatters.js";
import Seo from "../../components/common/Seo.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import DataTable from "../../components/common/DataTable.jsx";
import Badge from "../../components/common/Badge.jsx";
import Pagination from "../../components/common/Pagination.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState(""); // "" | "true" | "false"
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const toast = useToast();

  const load = async (p = page) => {
    setIsLoading(true);
    try {
      const params = { page: p, limit: 15 };
      if (filter) params.isApproved = filter;
      const res = await reviewsApi.list(params);
      setReviews(res.data.data || []);
      setMeta(res.data.meta || null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const toggleApproval = async (review) => {
    if (processingId) return;
    setProcessingId(review.id);
    try {
      await reviewsApi.moderate(review.id, !review.isApproved);
      toast.success(review.isApproved ? "Review hidden from product page." : "Review approved & published.");
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteReview = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await reviewsApi.remove(deleteTarget.id);
      toast.success("Review permanently deleted.");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  // Quick stats derived from current loaded set or meta total
  const stats = useMemo(() => {
    const total = meta?.totalItems || reviews.length;
    const approved = reviews.filter((r) => r.isApproved).length;
    const hidden = reviews.filter((r) => !r.isApproved).length;
    return { total, approved, hidden };
  }, [reviews, meta]);

  return (
    <div className="font-body text-ink max-w-6xl mx-auto space-y-6">
      <Seo title="Reviews" description="Moderate customer product reviews." />

      <PageHeader
        title={<span className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight text-ink">Product Reviews</span>}
        description="Approve, hide, or moderate customer reviews and ratings across your store."
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-line p-4 flex items-center justify-between shadow-2xs"
        >
          <div>
            <p className="text-xs font-mono font-bold text-muted uppercase tracking-wider">Total Reviews</p>
            <p className="font-heading text-2xl font-extrabold text-ink mt-0.5">{stats.total}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-panel flex items-center justify-center text-muted border border-line shadow-2xs">
            <MessageSquare size={18} />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-line p-4 flex items-center justify-between shadow-2xs"
        >
          <div>
            <p className="text-xs font-mono font-bold text-muted uppercase tracking-wider">Approved</p>
            <p className="font-heading text-2xl font-extrabold text-verify mt-0.5">{stats.approved}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-verifyLight flex items-center justify-center text-verify border border-verify/20 shadow-2xs">
            <CheckCircle2 size={18} />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-line p-4 flex items-center justify-between shadow-2xs"
        >
          <div>
            <p className="text-xs font-mono font-bold text-muted uppercase tracking-wider">Hidden</p>
            <p className="font-heading text-2xl font-extrabold text-muted mt-0.5">{stats.hidden}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-panel flex items-center justify-center text-muted border border-line shadow-2xs">
            <EyeOff size={18} />
          </div>
        </motion.div>
      </div>

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl border border-line shadow-2xs overflow-hidden"
      >
        {/* Pill Filter Bar */}
        <div className="p-4 border-b border-line bg-panel/30 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-muted mr-1.5 flex items-center gap-1">
              <Filter size={13} /> Filter Status:
            </span>
            {[
              { label: "All Reviews", value: "" },
              { label: "Approved Only", value: "true" },
              { label: "Hidden Only", value: "false" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none whitespace-nowrap ${
                  filter === tab.value
                    ? "bg-accent text-white shadow-2xs"
                    : "bg-white text-muted border border-line hover:text-ink hover:bg-panel"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          isLoading={isLoading}
          rows={reviews}
          emptyTitle="No reviews found"
          emptyDescription={
            filter !== ""
              ? "No customer reviews match your selected status filter."
              : "Customer reviews will appear here once submitted on product pages."
          }
          columns={[
            {
              key: "product",
              header: "Product",
              render: (r) => (
                <div className="flex items-start gap-2.5 max-w-xs py-0.5">
                  <div className="w-8 h-8 rounded-lg bg-panel flex items-center justify-center text-muted border border-line shrink-0 mt-0.5">
                    <ShoppingBag size={15} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink truncate font-heading">{r.product?.name || "Unknown Product"}</p>
                    <p className="text-[11px] font-mono text-muted truncate">ID: {r.productId || "N/A"}</p>
                  </div>
                </div>
              ),
            },
            {
              key: "reviewer",
              header: "Reviewer",
              render: (r) => (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-ink">{r.reviewerName || "Anonymous"}</p>
                  {r.isVerifiedPurchase && (
                    <Badge tone="verify">
                      Verified Purchase
                    </Badge>
                  )}
                </div>
              ),
            },
            {
              key: "rating",
              header: "Rating",
              render: (r) => (
                <div className="flex items-center gap-1 text-accent">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      size={14} 
                      fill={i < r.rating ? "currentColor" : "none"} 
                      className={i < r.rating ? "text-accent" : "text-gray-300"}
                      strokeWidth={1.5} 
                    />
                  ))}
                  <span className="text-xs font-mono font-bold text-ink ml-1">{r.rating}.0</span>
                </div>
              ),
            },
            {
              key: "comment",
              header: "Comment",
              className: "max-w-sm",
              render: (r) => (
                <p className="text-sm text-muted line-clamp-2 leading-relaxed">
                  {r.comment || <span className="italic text-muted/60">No comment provided.</span>}
                </p>
              ),
            },
            { 
              key: "date", 
              header: "Submitted", 
              render: (r) => {
                const rawDate = r.createdAt || r.created_at;
                return (
                  <div className="flex items-center gap-1.5 text-xs text-muted font-mono">
                    <Clock size={13} className="shrink-0" />
                    {rawDate ? formatDate(rawDate) : "—"}
                  </div>
                );
              } 
            },
            {
              key: "status",
              header: "Status",
              render: (r) => (
                <Badge tone={r.isApproved ? "verify" : "danger"}>
                  {r.isApproved ? "Approved" : "Hidden"}
                </Badge>
              ),
            },
            {
              key: "actions",
              header: "",
              headClassName: "text-right",
              className: "text-right",
              render: (r) => (
                <div className="flex justify-end gap-1">
                  <button
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                      r.isApproved
                        ? "text-muted hover:text-amber-600 hover:bg-amber-50 border-transparent hover:border-amber-200"
                        : "text-verify hover:bg-verifyLight border-transparent hover:border-verify/20"
                    }`}
                    title={r.isApproved ? "Hide review" : "Approve review"}
                    disabled={processingId === r.id}
                    onClick={() => toggleApproval(r)}
                  >
                    {processingId === r.id ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : r.isApproved ? (
                      <X size={15} />
                    ) : (
                      <Check size={15} />
                    )}
                  </button>

                  <button 
                    className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-dangerLight transition-colors border border-transparent hover:border-danger/20 cursor-pointer"
                    onClick={() => setDeleteTarget(r)}
                    aria-label="Delete review"
                    title="Delete review"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ),
            },
          ]}
        />

        {/* Pagination Section */}
        {meta && (
          <div className="border-t border-line p-4">
            <Pagination meta={meta} onPageChange={setPage} />
          </div>
        )}
      </motion.div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete customer review?"
        description="This review will be permanently removed and the overall product star rating will be recalculated."
        confirmLabel={isDeleting ? "Deleting..." : "Delete Review"}
        onConfirm={handleDeleteReview}
      />
    </div>
  );
}