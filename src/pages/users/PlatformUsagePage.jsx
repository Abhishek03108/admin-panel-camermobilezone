import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Smartphone, Globe, Layers, UserX, Search, Eye, Radio } from "lucide-react";
import { usersApi } from "../../api/users.api.js";
import { getErrorMessage } from "../../api/axiosClient.js";
import { useToast } from "../../context/ToastContext.jsx";
import { timeAgo, initials } from "../../utils/formatters.js";
import Seo from "../../components/common/Seo.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import DataTable from "../../components/common/DataTable.jsx";
import Pagination from "../../components/common/Pagination.jsx";
import PlatformBadges from "./PlatformBadges.jsx";

const FILTERS = [
  { value: "", label: "All" },
  { value: "app_only", label: "App only" },
  { value: "web_only", label: "Website only" },
  { value: "both", label: "App + Website" },
  { value: "app", label: "Any app user" },
  { value: "none", label: "Not seen yet" },
];

const LIVE_REFRESH_MS = 15000;

function Metric({ icon: Icon, label, value, sub, tone }) {
  return (
    <div className="bg-white rounded-2xl border border-line p-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-wider">
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${tone}`}>
          <Icon size={15} />
        </span>
        {label}
      </div>
      <p className="mt-2 text-2xl font-heading font-extrabold text-ink">{value ?? "—"}</p>
      {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

/** Who uses the mobile app, the website, or both — and who has the app open right now. */
export default function PlatformUsagePage() {
  const [usage, setUsage] = useState(null);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  const loadUsage = async () => {
    try {
      const res = await usersApi.platformUsage();
      setUsage(res.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const loadList = async (p = page) => {
    setIsLoading(true);
    try {
      const params = { page: p, limit: 20, sort: "active" };
      if (filter) params.platform = filter;
      if (search.trim()) params.search = search.trim();
      const res = await usersApi.list(params);
      setRows(res.data.data || []);
      setMeta(res.data.meta || null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Live count refreshes on its own every 15 seconds.
  useEffect(() => {
    loadUsage();
    const t = setInterval(loadUsage, LIVE_REFRESH_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      loadList(1);
    }, search ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search]);

  useEffect(() => {
    loadList(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const s = usage?.summary;
  const live = usage?.live;

  return (
    <div className="font-body text-ink max-w-6xl mx-auto space-y-6">
      <Seo title="App & Web Usage" description="Which customers use the app, the website, or both." />
      <PageHeader
        title={<span className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight text-ink">App &amp; Web Usage</span>}
        description="Which customers use the mobile app, the website, or both — and who has the app open right now."
      />

      {/* Live now */}
      <div className="bg-white rounded-2xl border border-line overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-verify opacity-60 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-verify" />
            </span>
            <h2 className="font-heading font-bold text-ink">Live on the app now</h2>
            <span className="text-sm font-mono font-bold text-verify">{live?.count ?? "…"}</span>
          </div>
          <span className="text-xs text-muted">Updates every 15 seconds</span>
        </div>
        {live?.users?.length ? (
          <div className="flex flex-wrap gap-2 p-4">
            {live.users.map((u) => (
              <Link
                key={u.id}
                to={`/users/${u.id}`}
                className="inline-flex items-center gap-2 rounded-xl border border-line px-3 py-2 hover:border-accent/40 hover:bg-panel transition-all"
              >
                <span className="w-7 h-7 rounded-full bg-verify/10 text-verify flex items-center justify-center text-xs font-bold">
                  {initials(u.fullName || "U")}
                </span>
                <span className="text-sm">
                  <span className="font-semibold text-ink">{u.fullName}</span>
                  {u.onlineSince && <span className="block text-xs text-muted">online since {timeAgo(u.onlineSince)}</span>}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="px-5 py-4 text-sm text-muted flex items-center gap-2">
            <Radio size={15} /> Nobody has the app open right now.
          </p>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Metric icon={Smartphone} tone="bg-accent-light text-accent-dark" label="App only" value={s?.app_only} sub={s ? `${s.app_total} use the app in total` : null} />
        <Metric icon={Globe} tone="bg-panel text-ink" label="Website only" value={s?.web_only} sub={s ? `${s.web_total} use the website in total` : null} />
        <Metric icon={Layers} tone="bg-verify-light text-verify" label="App + Website" value={s?.both} />
        <Metric icon={UserX} tone="bg-panel text-muted" label="Not seen yet" value={s?.none} sub="No login recorded" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-line p-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5"><Smartphone size={13} /> Active on the app</p>
          <div className="mt-2 flex gap-6 text-sm">
            <span><b className="text-lg text-ink">{s?.app_24h ?? "—"}</b> <span className="text-muted">24 h</span></span>
            <span><b className="text-lg text-ink">{s?.app_7d ?? "—"}</b> <span className="text-muted">7 days</span></span>
            <span><b className="text-lg text-ink">{s?.app_30d ?? "—"}</b> <span className="text-muted">30 days</span></span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-line p-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5"><Globe size={13} /> Active on the website (signed in)</p>
          <div className="mt-2 flex gap-6 text-sm">
            <span><b className="text-lg text-ink">{s?.web_24h ?? "—"}</b> <span className="text-muted">24 h</span></span>
            <span><b className="text-lg text-ink">{s?.web_7d ?? "—"}</b> <span className="text-muted">7 days</span></span>
            <span><b className="text-lg text-ink">{s?.web_30d ?? "—"}</b> <span className="text-muted">30 days</span></span>
          </div>
        </div>
      </div>

      {/* Customers */}
      <div className="bg-white rounded-2xl border border-line shadow-2xs overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 border-b border-line bg-panel/30">
          <div className="relative w-full sm:max-w-sm">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="w-full bg-panel/50 hover:bg-panel focus:bg-white border border-line rounded-xl pl-10 pr-4 py-2.5 text-base text-ink placeholder:text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
              placeholder="Search by name, email, or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5 flex-wrap justify-end">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  filter === f.value ? "bg-ink text-white border-ink" : "bg-white text-muted border-line hover:text-ink"
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
          emptyTitle="No customers match"
          columns={[
            {
              key: "user",
              header: "Customer",
              render: (u) => (
                <div className="py-1 min-w-0">
                  <p className="text-sm font-bold text-ink truncate">{u.fullName}</p>
                  <p className="text-xs text-muted truncate">{u.email}</p>
                </div>
              ),
            },
            { key: "uses", header: "Uses", render: (u) => <PlatformBadges user={u} /> },
            {
              key: "first",
              header: "First seen",
              render: (u) => (
                <div className="text-xs text-muted space-y-0.5">
                  {u.firstAppSeenAt && <p>App · {timeAgo(u.firstAppSeenAt)}</p>}
                  {u.firstWebSeenAt && <p>Web · {timeAgo(u.firstWebSeenAt)}</p>}
                  {!u.firstAppSeenAt && !u.firstWebSeenAt && <p>—</p>}
                </div>
              ),
            },
            {
              key: "actions",
              header: "",
              className: "text-right",
              render: (u) => (
                <Link to={`/users/${u.id}`} className="p-2 inline-flex rounded-xl border border-line text-muted hover:text-accent hover:border-accent/40" title="View customer">
                  <Eye size={15} />
                </Link>
              ),
            },
          ]}
        />
        <div className="p-4 border-t border-line bg-panel/20">
          <Pagination meta={meta} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
