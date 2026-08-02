import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Calendar, ShoppingBag } from "lucide-react";
import { usersApi } from "../../api/users.api.js";
import { getErrorMessage } from "../../api/axiosClient.js";
import { useToast } from "../../context/ToastContext.jsx";
import { formatCurrency, formatDate, formatDateTime, initials } from "../../utils/formatters.js";
import Seo from "../../components/common/Seo.jsx";
import Loader from "../../components/common/Loader.jsx";
import Badge from "../../components/common/Badge.jsx";
import DataTable from "../../components/common/DataTable.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";

// Helper for smooth manual loader delays to prevent flickering UI state
const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

export default function UserDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmToggle, setConfirmToggle] = useState(false);
  const toast = useToast();

  const load = async () => {
    setIsLoading(true);
    const start = Date.now();
    try {
      const res = await usersApi.get(id);
      setData(res.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      const elapsed = Date.now() - start;
      if (elapsed < 350) await delay(350 - elapsed);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleToggleStatus = async () => {
    try {
      await usersApi.setActiveStatus(id, !data.user.isActive);
      toast.success(data.user.isActive ? "Account deactivated." : "Account reactivated.");
      setConfirmToggle(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (isLoading) return <Loader full />;
  if (!data) return null;

  const { user, recentOrders = [] } = data;
  const userJoinedDate = user.createdAt || user.created_at;

  return (
    <div className="font-body text-ink max-w-6xl mx-auto space-y-6">
      <Seo title={user.fullName || "User Details"} />

      <Link
        to="/users"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink transition-colors"
      >
        <ArrowLeft size={16} />
        Back to users
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* User Card Sidebar */}
        <div className="bg-white rounded-2xl border border-line shadow-2xs p-6 text-center">
          <div className="w-20 h-20 rounded-2xl bg-accent/10 text-accent font-heading font-extrabold flex items-center justify-center text-2xl mx-auto mb-4 border border-accent/20">
            {initials(user.fullName || "User")}
          </div>

          <h2 className="text-xl font-heading font-bold text-ink truncate">{user.fullName || "N/A"}</h2>
          <p className="text-xs font-mono text-muted mt-1 mb-3 truncate">{user.publicId || user.id}</p>

          <Badge tone={user.isActive ? "verify" : "danger"}>
            {user.isActive ? "Active Account" : "Deactivated"}
          </Badge>

          <div className="text-left mt-6 pt-6 border-t border-line space-y-3.5 text-sm">
            <div className="flex items-center gap-3 text-muted">
              <Mail size={16} className="text-muted/70 shrink-0" />
              <span className="truncate font-semibold text-ink">{user.email || "—"}</span>
            </div>
            <div className="flex items-center gap-3 text-muted">
              <Phone size={16} className="text-muted/70 shrink-0" />
              <span className="font-mono text-ink">{user.mobile || "No mobile registered"}</span>
            </div>
            <div className="flex items-center gap-3 text-muted">
              <Calendar size={16} className="text-muted/70 shrink-0" />
              <span className="font-mono">
                Joined {userJoinedDate ? formatDate(userJoinedDate) : "—"}
              </span>
            </div>
          </div>

          <button
            className={`w-full mt-6 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
              user.isActive
                ? "bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20"
                : "bg-accent text-white hover:bg-accent/90 shadow-2xs"
            }`}
            onClick={() => setConfirmToggle(true)}
          >
            {user.isActive ? "Deactivate Account" : "Reactivate Account"}
          </button>
        </div>

        {/* Recent Orders Section */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-line shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-line bg-panel/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag size={18} className="text-accent" />
              <h3 className="text-base font-heading font-bold text-ink">Recent Orders</h3>
            </div>
            <span className="text-xs font-mono text-muted">
              Total: {recentOrders.length}
            </span>
          </div>

          <DataTable
            rows={recentOrders}
            emptyTitle="No orders placed yet"
            columns={[
              {
                key: "order",
                header: "Order ID",
                render: (o) => (
                  <Link
                    to={`/orders/${o.id}`}
                    className="text-sm font-mono font-bold text-accent hover:underline"
                  >
                    {o.publicId || o.id}
                  </Link>
                ),
              },
              {
                key: "date",
                header: "Date & Time",
                render: (o) => {
                  const orderDate = o.createdAt || o.created_at;
                  return (
                    <span className="text-xs font-mono text-muted">
                      {orderDate ? formatDateTime(orderDate) : "—"}
                    </span>
                  );
                },
              },
              {
                key: "amount",
                header: "Amount",
                render: (o) => (
                  <span className="text-sm font-mono font-bold text-ink">
                    {formatCurrency(o.totalAmount || 0)}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (o) => <Badge tone="neutral">{o.status || "Pending"}</Badge>,
              },
            ]}
          />
        </div>
      </div>

      <ConfirmDialog
        open={confirmToggle}
        onClose={() => setConfirmToggle(false)}
        title={user.isActive ? "Deactivate account?" : "Reactivate account?"}
        description={
          user.isActive
            ? "The customer will no longer be able to log in or place orders."
            : "The customer will regain access to log in and make purchases."
        }
        confirmLabel={user.isActive ? "Deactivate" : "Reactivate"}
        danger={user.isActive}
        onConfirm={handleToggleStatus}
      />
    </div>
  );
}