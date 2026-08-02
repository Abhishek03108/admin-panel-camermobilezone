
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Package,
  MapPin,
  Clock,
  Wallet,
  Truck,
  ExternalLink,
  Download,
  AlertTriangle,
  User,
  Phone,
  CheckCircle2,
  XCircle,
  Sparkles,
  ShieldCheck,
  Ban,
  Box,
  Truck as CourierIcon,
  ArrowRight,
  Send,
} from "lucide-react";
import { ordersApi } from "../../api/orders.api.js";
import { paymentsApi } from "../../api/payments.api.js";
import { deliveriesApi } from "../../api/deliveries.api.js";
import { getErrorMessage } from "../../api/axiosClient.js";
import { useToast } from "../../context/ToastContext.jsx";
import { formatDateTime } from "../../utils/formatters.js";
import { NEXT_ORDER_STATUSES } from "../../utils/constants.js";
import Seo from "../../components/common/Seo.jsx";
import Loader from "../../components/common/Loader.jsx";
import Badge from "../../components/common/Badge.jsx";
import Modal from "../../components/common/Modal.jsx";
import { Field, Input, Select, Textarea } from "../../components/common/FormField.jsx";

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

// Motion Variants
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

const timelineItemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0 },
};

// Custom Helper for Dynamic Timeline Icons
const getAuditIcon = (statusName) => {
  const s = String(statusName).toLowerCase();
  if (s.includes("delivered") || s.includes("confirmed"))
    return <CheckCircle2 size={15} className="text-emerald-500" />;
  if (s.includes("verified") || s.includes("payment"))
    return <ShieldCheck size={15} className="text-[#F97316]" />;
  if (s.includes("shipped") || s.includes("out for delivery"))
    return <CourierIcon size={15} className="text-blue-500" />;
  if (s.includes("packed"))
    return <Box size={15} className="text-amber-500" />;
  if (s.includes("cancelled") || s.includes("rejected"))
    return <Ban size={15} className="text-red-500" />;
  return <Sparkles size={15} className="text-gray-400" />;
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusModal, setStatusModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(null);
  const [deliveryModal, setDeliveryModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const toast = useToast();

  const formatNepaliCurrency = (amount) => {
    if (amount === undefined || amount === null) return "रू 0";
    return `NPR ${Number(amount).toLocaleString("ne-NP")}`;
  };

  const load = async () => {
    try {
      const res = await ordersApi.get(id);
      setOrder(res.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleVerifyPayment = async (paymentId, action, rejectionReason) => {
    if (processingPayment) return;
    setProcessingPayment(true);
    try {
      await paymentsApi.verify(paymentId, action, rejectionReason);
      toast.success(`Payment ${action.toLowerCase()}.`);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setProcessingPayment(false);
    }
  };

  if (isLoading) return <Loader full />;
  if (!order) return null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-12 text-gray-900"
    >
      <Seo title={`Order ${order.publicId}`} description="View and manage detailed order information." />

      <div className="flex items-center justify-between">
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-[#F97316] transition-colors"
        >
          <ArrowLeft size={16} /> Back to Customer Orders
        </Link>
      </div>

      {/* Top Header Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-gray-900 font-heading tracking-tight">
              {order.publicId}
            </h1>
            <Badge tone={STATUS_TONE[order.status] || "neutral"}>{order.status}</Badge>
            <Badge tone={PAYMENT_TONE[order.paymentStatus]}>Payment {order.paymentStatus}</Badge>
          </div>
          <p className="text-xs font-medium text-gray-400 flex items-center gap-1.5 mt-1">
            <Clock size={13} /> Placed on {formatDateTime(order.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1"}/admin/orders/${order.id}/invoice`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all shadow-xs"
          >
            <Download size={14} /> Download Invoice
          </a>
          {order.status !== "Cancelled" && order.status !== "Delivered" && (
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#F97316] hover:bg-[#EA6A0A] rounded-xl transition-all shadow-xs cursor-pointer"
              onClick={() => setStatusModal(true)}
            >
              Update Status
            </button>
          )}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Purchased Items Card */}
          <motion.div variants={cardVariants} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 font-heading mb-4 flex items-center gap-2 pb-3 border-b border-gray-100">
              <Package size={17} className="text-[#F97316]" /> Purchased Items ({order.items?.length || 0})
            </h3>
            
            <div className="divide-y divide-gray-100">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                  {item.productImage ? (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-12 h-12 rounded-xl object-cover border border-gray-100 bg-gray-50 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                      <Package size={20} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 line-clamp-1">{item.productName}</p>
                    <p className="text-[11px] font-semibold text-gray-400 mt-0.5">
                      {formatNepaliCurrency(item.unitPrice)} &times; {item.quantity}
                    </p>
                  </div>
                  <p className="text-xs font-extrabold text-gray-900 font-heading">
                    {formatNepaliCurrency(item.lineTotal)}
                  </p>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="border-t border-gray-100 mt-4 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-gray-500 font-medium">
                <span>Subtotal</span>
                <span className="font-bold text-gray-700">{formatNepaliCurrency(order.subtotalAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-500 font-medium">
                <span>Discount</span>
                <span className="font-bold text-emerald-600">-{formatNepaliCurrency(order.discountAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-500 font-medium">
                <span>Delivery Charge</span>
                <span className="font-bold text-gray-700">
                  {Number(order.deliveryCharge) === 0 ? "Free" : formatNepaliCurrency(order.deliveryCharge)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-gray-900 pt-2 border-t border-gray-100 font-heading">
                <span>Total Amount</span>
                <span className="text-[#F97316]">{formatNepaliCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </motion.div>

          {/* Payment Card */}
          <motion.div variants={cardVariants} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 font-heading mb-4 flex items-center gap-2 pb-3 border-b border-gray-100">
              <Wallet size={17} className="text-[#F97316]" /> Payment Information
            </h3>
            
            {!order.payments?.length ? (
              <p className="text-xs font-medium text-gray-400 italic">No payment verification screenshot submitted yet.</p>
            ) : (
              <div className="space-y-4">
                {order.payments.map((p) => (
                  <div key={p.id} className="flex flex-wrap sm:flex-nowrap gap-4 items-start border border-gray-100 bg-gray-50/50 rounded-xl p-4">
                    <a href={p.screenshotUrl} target="_blank" rel="noreferrer" className="shrink-0">
                      <img
                        src={p.screenshotUrl}
                        alt="Payment screenshot"
                        className="w-20 h-20 rounded-xl object-cover bg-white border border-gray-200 shadow-xs hover:opacity-90 transition-opacity"
                      />
                    </a>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge tone={PAYMENT_TONE[p.status]}>{p.status}</Badge>
                        <span className="text-[11px] font-medium text-gray-400">{formatDateTime(p.submittedAt)}</span>
                      </div>
                      <p className="text-xs font-extrabold text-gray-900 font-heading">
                        {formatNepaliCurrency(p.amount)} via Digital Transfer
                      </p>
                      {p.upiId && <p className="text-[11px] font-semibold text-gray-500">Ref / Phone: {p.upiId}</p>}
                      {p.rejectionReason && (
                        <p className="text-xs font-semibold text-red-600 bg-red-50 p-2 rounded-lg mt-2">
                          Rejected Reason: {p.rejectionReason}
                        </p>
                      )}
                      
                      {p.status === "Pending" && (
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs cursor-pointer"
                            disabled={processingPayment}
                            onClick={() => handleVerifyPayment(p.id, "Verified")}
                          >
                            <CheckCircle2 size={13} />
                            {processingPayment ? "Verifying..." : "Approve Payment"}
                          </button>
                          <button
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all border border-red-200 cursor-pointer"
                            onClick={() => setRejectModal(p)}
                          >
                            <XCircle size={13} /> Reject
                          </button>
                        </div>
                      )}
                      
                      <a
                        href={p.screenshotUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#F97316] mt-2 hover:underline"
                      >
                        View Full Screenshot <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Audit Trail & History Feed */}
          <motion.div variants={cardVariants} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <h3 className="text-sm font-bold text-gray-900 font-heading flex items-center gap-2">
                <Clock size={17} className="text-[#F97316]" /> Activity Audit Trail
              </h3>
              <span className="text-[11px] font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                {order.statusHistory?.length || 0} Events Logged
              </span>
            </div>

            <div className="relative pl-3 space-y-6 before:absolute before:left-[19px] before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-[#F97316] before:via-orange-200 before:to-gray-100">
              {order.statusHistory?.map((h, idx) => (
                <motion.div
                  key={h.id || idx}
                  variants={timelineItemVariants}
                  className="relative flex items-start gap-4 group"
                >
                  <div className="relative z-10 w-8 h-8 rounded-xl bg-white border-2 border-orange-100 group-hover:border-[#F97316] text-gray-700 flex items-center justify-center shadow-xs transition-colors shrink-0">
                    {getAuditIcon(h.status)}
                  </div>

                  <div className="flex-1 min-w-0 bg-gray-50/70 hover:bg-gray-50 border border-gray-100 rounded-2xl p-3.5 transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold text-gray-900 font-heading">
                        {h.status}
                      </span>
                      <span className="text-[10px] font-semibold text-gray-400 bg-white px-2 py-0.5 rounded-md border border-gray-100">
                        {formatDateTime(h.createdAt)}
                      </span>
                    </div>

                    {h.note ? (
                      <p className="text-xs text-gray-600 bg-white p-2.5 rounded-xl border border-gray-100 mt-2 font-medium leading-relaxed">
                        "{h.note}"
                      </p>
                    ) : (
                      <p className="text-[11px] text-gray-400 font-medium">System status transition performed.</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Shipping Address */}
          <motion.div variants={cardVariants} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 font-heading mb-3 flex items-center gap-2 pb-3 border-b border-gray-100">
              <MapPin size={17} className="text-[#F97316]" /> Shipping Address
            </h3>
            <div className="space-y-2 text-xs">
              <p className="font-bold text-gray-900 flex items-center gap-1.5 text-sm">
                <User size={14} className="text-gray-400" /> {order.shippingFullName}
              </p>
              <p className="font-semibold text-gray-500 flex items-center gap-1.5">
                <Phone size={13} className="text-gray-400" /> {order.shippingMobile}
              </p>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mt-2 text-gray-600 font-medium leading-relaxed">
                <p>Ward No. {order.shippingWardNo}, {order.shippingStreetArea}</p>
                <p>{order.shippingMunicipality}, {order.shippingDistrict}</p>
                <p>{order.shippingProvince} Province, Nepal</p>
              </div>
            </div>
          </motion.div>

          {/* Delivery Details */}
          <motion.div variants={cardVariants} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 font-heading flex items-center gap-2">
                <Truck size={17} className="text-[#F97316]" /> Courier & Delivery
              </h3>
              <button
                className="text-xs font-bold text-[#F97316] hover:underline cursor-pointer"
                onClick={() => setDeliveryModal(true)}
              >
                Edit
              </button>
            </div>
            
            {order.delivery ? (
              <div className="text-xs space-y-2 font-medium">
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400">Status</span>
                  <span className="font-bold text-gray-800">{order.delivery.status}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400">Courier Name</span>
                  <span className="font-bold text-gray-800">{order.delivery.courierName || "—"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-400">Tracking Number</span>
                  <span className="font-bold text-gray-800 font-mono">{order.delivery.trackingNumber || "—"}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs font-medium text-gray-400 italic">No courier dispatched yet.</p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {statusModal && (
          <StatusUpdateModal
            order={order}
            onClose={() => setStatusModal(false)}
            onDone={() => {
              setStatusModal(false);
              load();
            }}
          />
        )}

        {rejectModal && (
          <RejectReasonModal
            payment={rejectModal}
            onClose={() => setRejectModal(null)}
            onConfirm={handleVerifyPayment}
          />
        )}

        {deliveryModal && (
          <DeliveryEditModal
            order={order}
            onClose={() => setDeliveryModal(false)}
            onDone={() => {
              setDeliveryModal(false);
              load();
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatusUpdateModal({ order, onClose, onDone }) {
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const needsVerifiedPayment = status && status !== "Cancelled" && order.paymentStatus !== "Verified";

  const handleSubmit = async () => {
    if (!status) {
      toast.error("Please select a status.");
      return;
    }
    setIsSaving(true);
    try {
      await ordersApi.updateStatus(order.id, status, note);
      toast.success("Order status updated.");
      onDone();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Update Order Status"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full pt-2">
          <button
            className="px-4 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#F97316] hover:bg-[#EA6A0A] rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            onClick={handleSubmit}
            disabled={isSaving}
          >
            <Send size={13} />
            {isSaving ? "Updating..." : "Confirm Status Update"}
          </button>
        </div>
      }
    >
      <div className="space-y-4 pt-1">
        {/* Visual Flow Header */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3.5 flex items-center justify-between text-xs font-semibold">
          <div className="space-y-0.5">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Current Status</span>
            <p className="text-gray-800 font-bold">{order.status}</p>
          </div>
          <div className="w-7 h-7 rounded-full bg-orange-100 text-[#F97316] flex items-center justify-center font-bold shrink-0">
            <ArrowRight size={14} />
          </div>
          <div className="space-y-0.5 text-right">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Next Step</span>
            <p className="text-[#F97316] font-bold">{status || "Select below"}</p>
          </div>
        </div>

        <Field label="Target Fulfillment Status" required>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full text-xs font-bold text-gray-900 bg-white border border-gray-200 rounded-xl p-2.5 focus:border-[#F97316] focus:ring-2 focus:ring-orange-100 transition-all outline-none"
          >
            <option value="" className="text-gray-500 bg-white">
              Select Next Fulfillment Stage
            </option>
            {NEXT_ORDER_STATUSES.map((s) => (
              <option key={s} value={s} className="text-gray-900 bg-white">
                {s}
              </option>
            ))}
          </Select>
        </Field>

        {needsVerifiedPayment && (
          <div className="flex items-start gap-2.5 text-xs font-medium text-red-700 bg-red-50/80 rounded-2xl p-3.5 border border-red-200/60">
            <AlertTriangle size={17} className="shrink-0 mt-0.5 text-red-500" />
            <p className="leading-relaxed">
              <strong className="font-bold">Payment Unverified:</strong> Order payment must be approved before advancing fulfillment stages.
            </p>
          </div>
        )}

        <Field label="Audit Log Note (Optional)">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add an internal note explaining this status transition..."
            className="w-full text-xs font-medium text-gray-900 placeholder:text-gray-400 bg-white border border-gray-200 rounded-xl p-3 focus:border-[#F97316] focus:ring-2 focus:ring-orange-100 transition-all outline-none min-h-[90px] resize-y"
          />
        </Field>
      </div>
    </Modal>
  );
}

function RejectReasonModal({ payment, onClose, onConfirm }) {
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
      title="Reject Payment Screenshot"
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
            onClick={() => {
              onConfirm(payment.id, "Rejected", reason || "Screenshot unclear or invalid.");
              onClose();
            }}
          >
            <XCircle size={14} /> Reject Payment
          </button>
        </div>
      }
    >
      <div className="space-y-4 pt-1">
        <div className="bg-red-50/70 border border-red-100 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 font-bold">
            <XCircle size={20} />
          </div>
          <div className="text-xs">
            <p className="font-bold text-red-900">Payment Verification Action</p>
            <p className="text-red-600 font-medium text-[11px] mt-0.5">
              The customer will receive an email notice with the reason provided below.
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
            placeholder="Detailed explanation for rejecting this payment screenshot..."
            className="w-full text-xs font-medium text-gray-900 placeholder:text-gray-400 bg-white border border-gray-200 rounded-xl p-3 focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all outline-none min-h-[80px] resize-y"
          />
        </Field>
      </div>
    </Modal>
  );
}

function DeliveryEditModal({ order, onClose, onDone }) {
  const [form, setForm] = useState({
    courierName: order.delivery?.courierName || "",
    trackingNumber: order.delivery?.trackingNumber || "",
    trackingUrl: order.delivery?.trackingUrl || "",
    estimatedDeliveryDate: order.delivery?.estimatedDeliveryDate || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await deliveriesApi.update(order.id, form);
      toast.success("Delivery details updated.");
      onDone();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Manage Courier & Dispatch Details"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full pt-2">
          <button
            className="px-4 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#F97316] hover:bg-[#EA6A0A] rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Truck size={14} />
            {isSaving ? "Saving..." : "Save Delivery Info"}
          </button>
        </div>
      }
    >
      <div className="space-y-4 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field label="Courier Service Name">
            <Input
              value={form.courierName}
              onChange={(e) => setForm((f) => ({ ...f, courierName: e.target.value }))}
              placeholder="e.g. Nepal Can Move, Aramex"
              className="w-full text-xs font-medium text-gray-900 bg-white border border-gray-200 rounded-xl p-2.5 focus:border-[#F97316] focus:ring-2 focus:ring-orange-100 transition-all outline-none"
            />
          </Field>
          <Field label="Tracking Code / AWB">
            <Input
              value={form.trackingNumber}
              onChange={(e) => setForm((f) => ({ ...f, trackingNumber: e.target.value }))}
              placeholder="e.g. NCM-9821832"
              className="w-full text-xs font-medium text-gray-900 bg-white border border-gray-200 rounded-xl p-2.5 focus:border-[#F97316] focus:ring-2 focus:ring-orange-100 transition-all outline-none"
            />
          </Field>
        </div>

        <Field label="Live Tracking Web Link">
          <Input
            value={form.trackingUrl}
            onChange={(e) => setForm((f) => ({ ...f, trackingUrl: e.target.value }))}
            placeholder="https://courier.com/track/..."
            className="w-full text-xs font-medium text-gray-900 bg-white border border-gray-200 rounded-xl p-2.5 focus:border-[#F97316] focus:ring-2 focus:ring-orange-100 transition-all outline-none"
          />
        </Field>

        <Field label="Expected Delivery Date">
          <Input
            type="date"
            value={form.estimatedDeliveryDate?.slice(0, 10) || ""}
            onChange={(e) => setForm((f) => ({ ...f, estimatedDeliveryDate: e.target.value }))}
            className="w-full text-xs font-medium text-gray-900 bg-white border border-gray-200 rounded-xl p-2.5 focus:border-[#F97316] focus:ring-2 focus:ring-orange-100 transition-all outline-none"
          />
        </Field>
      </div>
    </Modal>
  );
}
