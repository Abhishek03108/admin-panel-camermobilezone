import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Search, Loader2, Users, Calendar } from "lucide-react";
import { usersApi } from "../../api/users.api.js";
import { getErrorMessage } from "../../api/axiosClient.js";
import { useToast } from "../../context/ToastContext.jsx";
import { formatDate, initials } from "../../utils/formatters.js";
import Seo from "../../components/common/Seo.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import DataTable from "../../components/common/DataTable.jsx";
import Badge from "../../components/common/Badge.jsx";
import Pagination from "../../components/common/Pagination.jsx";

// Helper for smooth manual loader delays to prevent layout flickering
const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

export default function UsersListPage() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  const load = async (p = page) => {
    setIsLoading(true);
    const start = Date.now();
    try {
      const params = { page: p, limit: 20 };
      if (search) params.search = search;
      const res = await usersApi.list(params);
      setUsers(res.data.data || []);
      setMeta(res.data.meta);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      const elapsed = Date.now() - start;
      if (elapsed < 350) await delay(350 - elapsed);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load(1);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div className="font-body text-ink max-w-6xl mx-auto space-y-7">
      <Seo title="Users" description="Manage customer accounts." />

      <PageHeader 
        title={<span className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight text-ink">Users</span>} 
        description="Customer accounts registered on the storefront." 
      />

      <div className="bg-white rounded-2xl border border-line shadow-2xs overflow-hidden">
        {/* Search Header Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 border-b border-line bg-panel/30">
          <div className="relative w-full sm:max-w-md">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="w-full bg-panel/50 hover:bg-panel focus:bg-white border border-line rounded-xl pl-10 pr-4 py-2.5 text-base font-body text-ink placeholder:text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
              placeholder="Search by name, email, or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {meta?.total > 0 && (
            <div className="text-sm font-mono font-semibold text-muted self-end sm:self-center">
              Total Customers: <span className="text-ink font-bold">{meta.total}</span>
            </div>
          )}
        </div>

        {/* Data Table */}
        <DataTable
          isLoading={isLoading}
          rows={users}
          emptyTitle="No users found"
          columns={[
            {
              key: "user",
              header: "User",
              render: (u) => (
                <div className="flex items-center gap-3.5 py-1">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent font-heading font-extrabold flex items-center justify-center text-sm shrink-0 border border-accent/20">
                    {initials(u.fullName || "User")}
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-bold text-ink font-heading truncate">{u.fullName || "N/A"}</p>
                    <p className="text-xs font-mono text-muted mt-0.5 truncate">{u.publicId || u.id}</p>
                  </div>
                </div>
              ),
            },
            {
              key: "contact",
              header: "Contact Details",
              render: (u) => (
                <div className="py-1">
                  <p className="text-sm font-semibold text-ink">{u.email || "—"}</p>
                  <p className="text-xs font-mono text-muted mt-0.5">{u.mobile || "No mobile registered"}</p>
                </div>
              ),
            },
            {
              key: "promo",
              header: "Promotions",
              render: (u) => (
                <Badge tone={u.isAllowedToGetPromotionalEmail ? "verify" : "neutral"}>
                  {u.isAllowedToGetPromotionalEmail ? "Opted In" : "Opted Out"}
                </Badge>
              ),
            },
            {
              key: "joined",
              header: "Joined Date",
              render: (u) => {
                // Fix: Check both createdAt and created_at
                const rawDate = u.createdAt || u.created_at;
                return (
                  <div className="flex items-center gap-1.5 text-sm font-mono text-muted">
                    <Calendar size={14} className="text-muted/70 shrink-0" />
                    <span>{rawDate ? formatDate(rawDate) : "—"}</span>
                  </div>
                );
              },
            },
            {
              key: "status",
              header: "Account Status",
              render: (u) => (
                <Badge tone={u.isActive ? "verify" : "danger"}>
                  {u.isActive ? "Active" : "Deactivated"}
                </Badge>
              ),
            },
            {
              key: "actions",
              header: "",
              headClassName: "text-right",
              className: "text-right",
              render: (u) => (
                <Link 
                  to={`/users/${u.id}`} 
                  className="p-2.5 inline-flex items-center justify-center rounded-xl border border-line text-muted hover:text-accent hover:border-accent/40 hover:bg-panel transition-all cursor-pointer"
                  title="View User Details"
                >
                  <Eye size={16} />
                </Link>
              ),
            },
          ]}
        />

        {/* Footer Pagination */}
        <div className="p-4 border-t border-line bg-panel/20">
          <Pagination meta={meta} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}