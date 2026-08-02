import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink,
  Wallet,
  CheckCircle2,
  XCircle,
  Filter,
  ShieldCheck,
  Clock,
  Sparkles,
  AlertTriangle,
  User,
} from "lucide-react";
import { paymentsApi } from "../../api/payments.api.js";
import { getErrorMessage } from "../../api/axiosClient.js";
import { useToast } from "../../context/ToastContext.jsx";
import { formatCurrency, formatDateTime } from "../../utils/formatters.js";
import Seo from "../../components/common/Seo.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import DataTable from "../../components/common/DataTable.jsx";
import Badge from "../../components/common/Badge.jsx";
import Pagination from "../../components/common/Pagination.jsx";
import Modal from "../../components/common/Modal.jsx";
import { Select, Field, Textarea } from "../../components/common/FormField.jsx";

const TONE = { Pending: "accent", Verified: "verify", Rejected: "danger" };

// Motion Variants (Matching Order Detail Page Animations)
const containerVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, staggerChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("Pending");
  const [isLoading, setIsLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const toast = useToast();

  const load = async (p = page) => {
    setIsLoading(true);
    try {
      const params = { page: p, limit: 15 };
      if (status) params.status = status;
      const res = await paymentsApi.list(params);
      setPayments(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const verify = async (id, action, rejectionReason) => {
    if (processingId) return; // a verify/reject request is already in flight
    setProcessingId(id);
    try {
      await paymentsApi.verify(id, action, rejectionReason);
      toast.success(`Payment ${action.toLowerCase()}.`);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-12 text-gray-900"
    >
      <Seo title="Payments" description="Verify customer UPI payment screenshots." />

      <PageHeader
        title="Payment Verifications"
        description="Review and verify manual customer payment transfers and screenshots."
      />

      {/* Filter Card */}
      <motion.div
        variants={cardVariants}
        className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-[#F97316]" />
            <span className="text-xs font-bold text-gray-700">Filter Status:</span>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="!w-48 text-xs font-bold text-gray-900 bg-white border border-gray-200 rounded-xl p-2 focus:border-[#F97316] focus:ring-2 focus:ring-orange-100 transition-all outline-none"
            >
              <option value="" className="text-gray-900 bg-white">
                All Statuses
              </option>
              <option value="Pending" className="text-gray-900 bg-white">
                Pending Verification
              </option>
              <option value="Verified" className="text-gray-900 bg-white">
                Verified
              </option>
              <option value="Rejected" className="text-gray-900 bg-white">
                Rejected
              </option>
            </Select>
          </div>

          {meta && (
            <span className="text-xs font-semibold text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100">
              Showing {payments.length} of {meta.totalItems || payments.length} Payments
            </span>
          )}
        </div>

        {/* Data Table */}
        <DataTable
          isLoading={isLoading}
          rows={payments}
          emptyTitle="No payment records found"
          columns={[
            {
              key: "screenshot",
              header: "Screenshot",
              render: (p) => (
                <a
                  href={p.screenshotUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative inline-block"
                >
                  <img
                    src={p.screenshotUrl}
                    alt="Payment Screenshot"
                    className="w-12 h-12 rounded-xl object-cover bg-gray-50 border border-gray-200 shadow-xs group-hover:opacity-85 transition-all"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 rounded-xl transition-opacity">
                    <ExternalLink size={12} className="text-white" />
                  </div>
                </a>
              ),
            },
            {
              key: "order",
              header: "Order",
              render: (p) => (
                <Link
                  to={`/orders/${p.order?.id}`}
                  className="text-xs font-bold text-[#F97316] hover:underline inline-flex items-center gap-1 font-mono"
                >
                  {p.order?.publicId} <ExternalLink size={11} />
                </Link>
              ),
            },
            {
              key: "customer",
              header: "Customer",
              render: (p) => (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                  <User size={13} className="text-gray-400" />
                  <span>{p.user?.fullName || "—"}</span>
                </div>
              ),
            },
            {
              key: "amount",
              header: "Amount",
              render: (p) => (
                <span className="text-xs font-extrabold text-gray-900 font-heading">
                  {formatCurrency(p.amount)}
                </span>
              ),
            },
            {
              key: "submitted",
              header: "Submitted",
              render: (p) => (
                <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                  <Clock size={12} /> {formatDateTime(p.submittedAt)}
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (p) => <Badge tone={TONE[p.status]}>{p.status}</Badge>,
            },
            {
              key: "actions",
              header: "",
              headClassName: "text-right",
              className: "text-right",
              render: (p) =>
                p.status === "Pending" ? (
                  <div className="flex justify-end gap-2">
                    <button
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
                      disabled={processingId === p.id}
                      onClick={() => verify(p.id, "Verified")}
                    >
                      <CheckCircle2 size={13} />
                      {processingId === p.id ? "Verifying…" : "Approve"}
                    </button>
                    <button
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all border border-red-200 cursor-pointer disabled:opacity-50"
                      disabled={processingId === p.id}
                      onClick={() => setRejectTarget(p)}
                    >
                      <XCircle size={13} /> Reject
                    </button>
                  </div>
                ) : null,
            },
          ]}
        />

        <div className="p-4 border-t border-gray-100">
          <Pagination meta={meta} onPageChange={setPage} />
        </div>
      </motion.div>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectTarget && (
          <RejectModal
            payment={rejectTarget}
            onClose={() => setRejectTarget(null)}
            onConfirm={(reason) => {
              verify(rejectTarget.id, "Rejected", reason);
              setRejectTarget(null);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

{/* Enhanced Animated Reject Modal */}
function RejectModal({ payment, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  const PRESETS = [
    "Amount Mismatch",
    "Screenshot Unclear / Cropped",
    "Invalid Reference ID",
    "Duplicate Submission",
  ];

  return (
    <Modal
      open
      onClose={onClose}
      title={`Reject Payment for ${payment.order?.publicId}`}
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full pt-2">
          <button
            className="px-4 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-xs cursor-pointer"
            onClick={() => onConfirm(reason || "Screenshot unclear or invalid.")}
          >
            <XCircle size={14} /> Reject Payment
          </button>
        </div>
      }
    >
      <div className="space-y-4 pt-1">
        <div className="bg-red-50/70 border border-red-100 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 font-bold">
            <AlertTriangle size={20} />
          </div>
          <div className="text-xs">
            <p className="font-bold text-red-900">Rejection Notice</p>
            <p className="text-red-600 font-medium text-[11px] mt-0.5">
              The user will be notified via email with the reason specified below.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2">Quick Presets</label>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setReason(preset)}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-orange-50 hover:text-[#F97316] text-gray-600 transition-colors border border-gray-200/60 cursor-pointer"
              >
                + {preset}
              </button>
            ))}
          </div>
        </div>

        <Field label="Rejection Reason" required>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Screenshot doesn't match the order total amount."
            className="w-full text-xs font-medium text-gray-900 placeholder:text-gray-400 bg-white border border-gray-200 rounded-xl p-3 focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all outline-none min-h-[90px] resize-y"
          />
        </Field>
      </div>
    </Modal>
  );
}