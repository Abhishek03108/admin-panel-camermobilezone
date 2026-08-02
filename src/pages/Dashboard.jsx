import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Banknote,
  ShoppingBag,
  CalendarCheck2,
  Clock,
  Users,
  Boxes,
  PackageX,
  Mail,
  ArrowUpRight,
  ShieldAlert,
  MessageSquare,
} from "lucide-react";
import { dashboardApi } from "../api/dashboard.api.js";
import { getErrorMessage } from "../api/axiosClient.js";
import { useToast } from "../context/ToastContext.jsx";
import { formatCurrency } from "../utils/formatters.js";
import Seo from "../components/common/Seo.jsx";
import PageHeader from "../components/common/PageHeader.jsx";
import Loader from "../components/common/Loader.jsx";
import Badge from "../components/common/Badge.jsx";

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

// Enhanced Framer Motion Animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1.0],
    },
  },
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    dashboardApi
      .summary()
      .then((res) => setData(res.data.data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) return <Loader full />;
  if (!data) return null;

  const STATS = [
    {
      label: "Total Revenue (Verified)",
      value: formatCurrency(data.totalRevenue),
      icon: Banknote,
      subtitle: "Verified payments",
    },
    {
      label: "Total Orders",
      value: data.totalOrders,
      icon: ShoppingBag,
      subtitle: "Lifetime volume",
    },
    {
      label: "Orders Today",
      value: data.ordersToday,
      icon: CalendarCheck2,
      subtitle: "Last 24 hours",
    },
    {
      label: "Pending Verification",
      value: data.pendingPaymentVerification,
      icon: Clock,
      subtitle: "Needs review",
      urgent: data.pendingPaymentVerification > 0,
    },
    {
      label: "Total Registered Users",
      value: data.totalUsers,
      icon: Users,
      subtitle: "Active customer base",
    },
    {
      label: "Active Products",
      value: `${data.activeProducts} / ${data.totalProducts}`,
      icon: Boxes,
      subtitle: "Published in catalog",
    },
    {
      label: "Out of Stock",
      value: data.outOfStockProducts,
      icon: PackageX,
      subtitle: "Requires restock",
      urgent: data.outOfStockProducts > 0,
    },
    {
      label: "Newsletter Subscribers",
      value: data.newsletterSubscribers,
      icon: Mail,
      subtitle: "Audience reach",
    },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6 pb-10"
    >
      <Seo title="Dashboard" description="Overview of orders, revenue, and store activity." />

      <motion.div variants={sectionVariants}>
        <PageHeader
          title="Dashboard"
          description="A real-time metrics overview of store operations and customer activity."
        />
      </motion.div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <motion.div
            key={stat.label}
            variants={cardVariants}
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className={`bg-white rounded-2xl p-5 border ${
              stat.urgent ? "border-[#F97316]/50 ring-2 ring-[#FFF1E6]" : "border-gray-200"
            } shadow-xs transition-all duration-200 flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-heading">
                {stat.label}
              </span>
              <motion.div
                whileHover={{ rotate: 8, scale: 1.05 }}
                className="w-9 h-9 rounded-xl bg-[#FFF1E6] text-[#F97316] flex items-center justify-center shrink-0 border border-orange-100"
              >
                <stat.icon size={18} />
              </motion.div>
            </div>

            <div className="mt-1">
              <p className="text-2xl font-extrabold text-gray-900 font-heading tracking-tight">
                {stat.value}
              </p>
              <p className="text-xs font-medium text-gray-400 mt-1 flex items-center gap-1">
                {stat.subtitle}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Breakdown & Attention Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Orders by Status */}
        <motion.div
          variants={sectionVariants}
          className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs"
        >
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
            <div>
              <h3 className="text-base font-bold text-gray-900 font-heading">
                Orders by Status
              </h3>
              <p className="text-xs font-medium text-gray-400 mt-0.5">
                Distribution of recent store purchases
              </p>
            </div>
            <Link
              to="/orders"
              className="text-xs font-bold text-[#F97316] hover:text-[#EA6A0A] inline-flex items-center gap-1 hover:underline transition-all"
            >
              View All Orders <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="space-y-3">
            {data.ordersByStatus.length === 0 ? (
              <div className="text-center py-8 text-sm font-semibold text-gray-400">
                No orders recorded yet.
              </div>
            ) : (
              data.ordersByStatus.map((row) => (
                <motion.div
                  key={row.status}
                  whileHover={{ x: 3 }}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50/80 transition-colors border border-transparent hover:border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <Badge tone={STATUS_TONE[row.status] || "neutral"}>
                      {row.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900 font-heading">
                      {row.count}
                    </span>
                    <span className="text-xs font-medium text-gray-400">orders</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Action Center - Needs Attention */}
        <motion.div
          variants={sectionVariants}
          className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs"
        >
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
            <div>
              <h3 className="text-base font-bold text-gray-900 font-heading flex items-center gap-2">
                <ShieldAlert size={18} className="text-[#F97316]" /> Needs Your Attention
              </h3>
              <p className="text-xs font-medium text-gray-400 mt-0.5">
                Operational tasks requiring immediate action
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            {/* Payments awaiting verification */}
            <motion.div whileHover={{ x: 2 }}>
              <Link
                to="/payments"
                className="group flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-[#FFF1E6]/40 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF1E6] text-[#F97316] flex items-center justify-center shrink-0 border border-orange-100">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 group-hover:text-[#EA6A0A] transition-colors">
                      Payments awaiting verification
                    </p>
                    <p className="text-xs font-medium text-gray-400">
                      Manual bank transfer receipts
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-extrabold px-3 py-1 rounded-lg ${
                      data.pendingPaymentVerification > 0
                        ? "bg-[#FFF1E6] text-[#EA6A0A]"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {data.pendingPaymentVerification}
                  </span>
                  <ArrowUpRight size={16} className="text-gray-400 group-hover:text-[#F97316] transition-colors" />
                </div>
              </Link>
            </motion.div>

            {/* Unresolved contact messages */}
            <motion.div whileHover={{ x: 2 }}>
              <Link
                to="/contact-messages"
                className="group flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-[#FFF1E6]/40 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF1E6] text-[#F97316] flex items-center justify-center shrink-0 border border-orange-100">
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 group-hover:text-[#EA6A0A] transition-colors">
                      Unresolved contact messages
                    </p>
                    <p className="text-xs font-medium text-gray-400">
                      Customer support inquiries
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-extrabold px-3 py-1 rounded-lg ${
                      data.unresolvedContactMessages > 0
                        ? "bg-[#FFF1E6] text-[#EA6A0A]"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {data.unresolvedContactMessages}
                  </span>
                  <ArrowUpRight size={16} className="text-gray-400 group-hover:text-[#F97316] transition-colors" />
                </div>
              </Link>
            </motion.div>

            {/* Out of stock products */}
            <motion.div whileHover={{ x: 2 }}>
              <Link
                to="/products"
                className="group flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-[#FFF1E6]/40 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF1E6] text-[#F97316] flex items-center justify-center shrink-0 border border-orange-100">
                    <PackageX size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 group-hover:text-[#EA6A0A] transition-colors">
                      Products out of stock
                    </p>
                    <p className="text-xs font-medium text-gray-400">
                      Items needing inventory refill
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-extrabold px-3 py-1 rounded-lg ${
                      data.outOfStockProducts > 0
                        ? "bg-[#FFF1E6] text-[#EA6A0A]"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {data.outOfStockProducts}
                  </span>
                  <ArrowUpRight size={16} className="text-gray-400 group-hover:text-[#F97316] transition-colors" />
                </div>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}