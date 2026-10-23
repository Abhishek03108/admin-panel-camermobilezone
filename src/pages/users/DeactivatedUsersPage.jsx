import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Eye, UserCheck, XCircle, MessageSquareText } from "lucide-react";
import { usersApi } from "../../api/users.api.js";
import { getErrorMessage } from "../../api/axiosClient.js";
import { useToast } from "../../context/ToastContext.jsx";
import { formatDateTime, initials } from "../../utils/formatters.js";
import Seo from "../../components/common/Seo.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import DataTable from "../../components/common/DataTable.jsx";
import Pagination from "../../components/common/Pagination.jsx";
import Badge from "../../components/common/Badge.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import { deactivationLabel } from "./deactivation.js";

const FILTERS = [
  { value: "", label: "All" },
  { value: "FAKE_PAYMENT", label: "Fake payment" },
  { value: "ADMIN", label: "By admin" },
  { value: "SELF", label: "By customer" },
];

/**
 * Accounts that are switched off, why, and any reactivation request the
 * customer sent from the storefront — with Reactivate / Decline actions.
 */
export default function DeactivatedUsersPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [confirm, setConfirm] = useState(null); // { kind: "reactivate" | "decline", user }
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const load = async (p = page) => {
    setIsLoading(true);
    try {
      const params = { page: p, limit: 20 };
      if (search.trim()) params.search = search.trim();
      if (reason) params.reason = reason;
      const res = await usersApi.listDeactivated(params);
      setRows(res.data.data || []);
      setMeta(res.data.meta || null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load(1);
    }, search ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, reason]);

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const run = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      const { kind, user } = confirm;
      const request = user.latestReactivationRequest;
      const res =
        kind === "decline"
          ? await usersApi.handleReactivationRequest(request.id, "Decline")
          : request?.status === "Pending"
            ? await usersApi.handleReactivationRequest(request.id, "Approve")
            : await usersApi.setActiveStatus(user.id, true);
      toast.success(res.data.message);
      setConfirm(null);
      load(page);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const pending = meta?.pendingRequests ?? 0;

  return (
    <div className="font-body text-ink max-w-6xl mx-auto space-y-6">
      <Seo title="Deactivated Accounts" description="Deactivated customer accounts and reactivation requests." />

      <PageHeader
        title={<span className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight text-ink">Deactivated Accounts</span>}
        description="Customers who can't sign in, why, and their reactivation requests. Accounts are deactivated automatically when a payment is rejected as fake."
      />

      {pending > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-accent/25 bg-accent/5 px-5 py-4 text-sm">
          <MessageSquareText size={20} className="text-accent shrink-0" />
          <span>
            <span className="font-bold text-ink">{pending}</span>{" "}
            {pending === 1 ? "reactivation request is" : "reactivation requests are"} waiting for review.
          </span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-line shadow-2xs overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 border-b border-line bg-panel/30">
          <div className="relative w-full sm:max-w-md">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="w-full bg-panel/50 hover:bg-panel focus:bg-white border border-line rounded-xl pl-10 pr-4 py-2.5 text-base text-ink placeholder:text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
              placeholder="Search by name, email, or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setReason(f.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  reason === f.value ? "bg-ink text-white border-ink" : "bg-white text-muted border-line hover:text-ink"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <DataTable
          isLoading={isLoading}
          rows={rows}
          emptyTitle="No deactivated accounts"
          columns={[
            {
              key: "user",
              header: "Customer",
              render: (u) => (
                <div className="flex items-center gap-3 py-1">
                  <div className="w-10 h-10 rounded-xl bg-danger/10 text-danger font-heading font-extrabold flex items-center justify-center text-sm shrink-0 border border-danger/20">
                    {initials(u.fullName || "User")}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink truncate">{u.fullName}</p>
                    <p className="text-xs text-muted truncate">{u.email}</p>
                    <p className="text-xs font-mono text-muted">{u.mobile}</p>
                  </div>
                </div>
              ),
            },
            {
              key: "reason",
              header: "Why",
              render: (u) => {
                const label = deactivationLabel(u.deactivationReason);
                return (
                  <div className="space-y-1 max-w-[220px]">
                    <Badge tone={label.tone}>{label.text}</Badge>
                    {u.paymentRejectionCount > 0 && (
                      <p className="text-xs font-semibold text-danger">Payment rejected ×{u.paymentRejectionCount}</p>
                    )}
                    {u.deactivationNote && <p className="text-xs text-muted">{u.deactivationNote}</p>}
                    {u.deactivatedAt && <p className="text-xs font-mono text-muted">{formatDateTime(u.deactivatedAt)}</p>}
                  </div>
                );
              },
            },
            {
              key: "request",
              header: "Reactivation request",
              render: (u) => {
                const r = u.latestReactivationRequest;
                if (!r) return <span className="text-xs text-muted">None</span>;
                return (
                  <div className="space-y-1 max-w-[320px]">
                    <Badge tone={r.status === "Pending" ? "accent" : r.status === "Approved" ? "verify" : "neutral"}>
                      {r.status}
                    </Badge>
                    <p className="text-xs text-ink whitespace-pre-wrap line-clamp-4">{r.message}</p>
                    <p className="text-xs font-mono text-muted">{formatDateTime(r.updatedAt || r.createdAt)}</p>
                  </div>
                );
              },
            },
            {
              key: "actions",
              header: "",
              headClassName: "text-right",
              className: "text-right",
              render: (u) => {
                const canRevive = u.deactivationReason !== "DELETED";
                const hasPending = u.latestReactivationRequest?.status === "Pending";
                return (
                  <div className="flex items-center justify-end gap-2">
                    {canRevive && (
                      <button
                        type="button"
                        onClick={() => setConfirm({ kind: "reactivate", user: u })}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-verify/10 border border-verify/20 px-3 py-1.5 text-xs font-semibold text-verify hover:bg-verify/20 transition-all cursor-pointer"
                      >
                        <UserCheck size={14} /> Reactivate
                      </button>
                    )}
                    {hasPending && (
                      <button
                        type="button"
                        onClick={() => setConfirm({ kind: "decline", user: u })}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:text-danger hover:border-danger/30 transition-all cursor-pointer"
                      >
                        <XCircle size={14} /> Decline
                      </button>
                    )}
                    <Link
                      to={`/users/${u.id}`}
                      className="p-2 inline-flex items-center justify-center rounded-xl border border-line text-muted hover:text-accent hover:border-accent/40 transition-all"
                      title="View customer"
                    >
                      <Eye size={15} />
                    </Link>
                  </div>
                );
              },
            },
          ]}
        />

        <div className="p-4 border-t border-line bg-panel/20">
          <Pagination meta={meta} onPageChange={setPage} />
        </div>
      </div>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => !busy && setConfirm(null)}
        loading={busy}
        danger={confirm?.kind === "decline"}
        title={confirm?.kind === "decline" ? "Decline this request?" : `Reactivate ${confirm?.user?.fullName}?`}
        description={
          confirm?.kind === "decline"
            ? "The account stays deactivated. The customer can send a new request later."
            : "They'll be able to sign in and place orders again, and we'll email them. Their payment rejection history is kept."
        }
        confirmLabel={confirm?.kind === "decline" ? "Decline request" : "Reactivate account"}
        onConfirm={run}
      />
    </div>
  );
}
