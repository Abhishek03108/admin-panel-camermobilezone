import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  FilterX,
  PackageCheck,
  User,
  Calendar,
  ChevronRight,
  RefreshCw,
  Phone,
  Search,
  X,
} from "lucide-react";
import { ordersApi } from "../../api/orders.api.js";
import { getErrorMessage } from "../../api/axiosClient.js";
import { useToast } from "../../context/ToastContext.jsx";
import { formatDateTime } from "../../utils/formatters.js";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "../../utils/constants.js";
import Seo from "../../components/common/Seo.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import Badge from "../../components/common/Badge.jsx";
import Pagination from "../../components/common/Pagination.jsx";
import { Select } from "../../components/common/FormField.jsx";

const STATUS_TONE = {
  "Payment Verification Pending": "accent",
  "Payment Verified": "verify",
  "Order Confirmed": "verify",
  Packed: "verify",
  Shipped: "verify",
  "Out For Delivery": "verify",
  Delivered: "verify",
  Cancelled: "danger",
};

const PAYMENT_TONE = {
  Pending: "accent",
  Verified: "verify",
  Rejected: "danger",
};

// Framer Motion Animation Variants
const containerVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 350, damping: 25 },
  },
};

// Debounce delay for the search box, so we don't fire a request on every
// keystroke — waits for a short pause in typing first.
const SEARCH_DEBOUNCE_MS = 400;

export default function OrdersListPage() {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [searchInput, setSearchInput] = useState(""); // what the admin is typing, updates instantly
  const [search, setSearch] = useState(""); // the debounced value actually sent to the API
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  // Nepali Rupee Formatter using NPR / रू
  const formatNepaliCurrency = (amount) => {
    if (amount === undefined || amount === null) return "रू 0";
    return `NPR ${Number(amount).toLocaleString("ne-NP")}`;
  };

  const load = async (p = page) => {
    setIsLoading(true);
    try {
      const params = { page: p, limit: 15 };
      if (status) params.status = status;
      if (paymentStatus) params.paymentStatus = paymentStatus;
      if (search) params.search = search;
      const res = await ordersApi.list(params);
      setOrders(res.data.data || []);
      setMeta(res.data.meta || null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce: wait for the admin to pause typing before actually
  // searching, so we're not firing a request per keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, paymentStatus, search]);

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const hasActiveFilters = Boolean(status || paymentStatus || search);

  const clearFilters = () => {
    setStatus("");
    setPaymentStatus("");
    setSearchInput("");
    setSearch("");
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-12"
    >
      <Seo title="Orders Management" description="Track and process customer orders in real-time." />

      <PageHeader
        title="Customer Orders"
        description="Monitor, verify, and fulfill customer purchases seamlessly across Nepal. Newest orders always appear first."
      />

      {/* Main Card Container */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">

        {/* Filter Controls Bar */}
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search by order reference, customer name, email, or mobile */}
            <div className="relative min-w-[240px] flex-1 sm:flex-none">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search order ref, customer, email, mobile…"
                className="w-full text-xs font-semibold rounded-xl border border-gray-200 pl-8 pr-8 py-2.5 focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] transition-all outline-none"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="relative min-w-[200px]">
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-xs font-semibold rounded-xl border-gray-200 focus:border-[#F97316] focus:ring-[#F97316] transition-all"
              >
                <option value="">All Order Statuses</option>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>

            <div className="relative min-w-[180px]">
              <Select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full text-xs font-semibold rounded-xl border-gray-200 focus:border-[#F97316] focus:ring-[#F97316] transition-all"
              >
                <option value="">All Payment Statuses</option>
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>

            {hasActiveFilters && (
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-500 hover:text-[#EA6A0A] bg-white border border-gray-200 hover:border-orange-200 rounded-xl transition-all shadow-xs"
              >
                <FilterX size={14} /> Clear Filters
              </motion.button>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold text-gray-400">
            <span>Showing {orders.length} orders</span>
            <button
              onClick={() => load(page)}
              className="p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all shadow-xs"
              title="Refresh order list"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin text-[#F97316]" : ""} />
            </button>
          </div>
        </div>

        {/* Table & Smooth Loading States */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-3.5 px-5">Order Reference</th>
                <th className="py-3.5 px-4">Customer Details</th>
                <th className="py-3.5 px-4">Total Amount (NPR)</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Fulfillment</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={`skeleton-${idx}`} className="animate-pulse">
                      <td className="py-4 px-5">
                        <div className="h-4 w-28 bg-gray-200 rounded-md mb-1.5" />
                        <div className="h-3 w-20 bg-gray-100 rounded-md" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-4 w-32 bg-gray-200 rounded-md mb-1.5" />
                        <div className="h-3 w-24 bg-gray-100 rounded-md" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-4 w-24 bg-gray-200 rounded-md" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-6 w-20 bg-gray-200 rounded-full" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-6 w-28 bg-gray-200 rounded-full" />
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="h-8 w-24 bg-gray-200 rounded-xl ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center max-w-sm mx-auto"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-[#FFF1E6] text-[#F97316] flex items-center justify-center border border-orange-100 mb-4">
                          <ShoppingBag size={26} />
                        </div>
                        <h4 className="text-base font-bold text-gray-900 font-heading">No Orders Found</h4>
                        <p className="text-xs font-medium text-gray-400 mt-1">
                          {hasActiveFilters
                            ? "No purchases match your search or filters. Try adjusting your selections."
                            : "New order placements will automatically appear here."}
                        </p>
                        {hasActiveFilters && (
                          <button
                            onClick={clearFilters}
                            className="mt-4 px-4 py-2 text-xs font-bold text-[#F97316] bg-[#FFF1E6] hover:bg-orange-100 rounded-xl transition-colors"
                          >
                            Reset Search & Filters
                          </button>
                        )}
                      </motion.div>
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <motion.tr
                      key={o.id}
                      variants={rowVariants}
                      whileHover={{ backgroundColor: "rgba(249, 115, 22, 0.02)" }}
                      className="group transition-colors duration-150"
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gray-100 group-hover:bg-[#FFF1E6] text-gray-500 group-hover:text-[#F97316] flex items-center justify-center transition-colors">
                            <PackageCheck size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 font-heading tracking-tight">
                              {o.publicId}
                            </p>
                            <p className="text-[11px] font-medium text-gray-400 flex items-center gap-1 mt-0.5">
                              <Calendar size={11} />
                              {o.createdAt ? formatDateTime(o.createdAt) : "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                            <User size={13} className="text-gray-400 shrink-0" />
                            {o.user?.fullName || "Guest Customer"}
                          </p>
                          <p className="text-[11px] font-medium text-gray-400 flex items-center gap-1.5 pl-4">
                            <Phone size={11} className="text-gray-300 shrink-0" />
                            {o.user?.mobile || "N/A"}
                          </p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-sm font-extrabold text-gray-900 font-heading">
                          {formatNepaliCurrency(o.totalAmount)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge tone={PAYMENT_TONE[o.paymentStatus] || "neutral"}>
                          {o.paymentStatus}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge tone={STATUS_TONE[o.status] || "neutral"}>
                          {o.status}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <Link
                          to={`/orders/${o.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 group-hover:bg-[#F97316] text-gray-700 group-hover:text-white border border-gray-200 group-hover:border-[#F97316] text-xs font-bold transition-all duration-200 shadow-xs"
                        >
                          View Details
                          <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {meta && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <Pagination meta={meta} onPageChange={setPage} />
          </div>
        )}
      </div>
    </motion.div>
  );
}