import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { accountDeletionsApi } from "../../api/users.api.js";
import { getErrorMessage } from "../../api/axiosClient.js";
import { useToast } from "../../context/ToastContext.jsx";
import { formatDateTime } from "../../utils/formatters.js";
import Seo from "../../components/common/Seo.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import DataTable from "../../components/common/DataTable.jsx";
import Pagination from "../../components/common/Pagination.jsx";

export default function AccountDeletionsPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  const load = async (p = 1) => {
    setIsLoading(true);
    try {
      const params = { page: p, limit: 20 };
      if (search.trim()) params.search = search.trim();
      const res = await accountDeletionsApi.list(params);
      setRows(res.data.data || []);
      setMeta(res.data.meta || null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => load(1), search ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const columns = [
    { key: "createdAt", header: "Deleted", render: (d) => <span className="whitespace-nowrap">{formatDateTime(d.createdAt)}</span> },
    {
      key: "who",
      header: "Customer",
      render: (d) => (
        <div>
          <p className="font-medium text-ink">{d.fullName}</p>
          <p className="text-xs text-muted">{d.email}</p>
        </div>
      ),
    },
    { key: "userPublicId", header: "User ID", render: (d) => <span className="font-mono text-xs">{d.userPublicId}</span> },
    { key: "orderCount", header: "Past orders" },
    { key: "reason", header: "Reason given", render: (d) => <p className="text-muted line-clamp-2 max-w-sm">{d.reason || "—"}</p> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="max-w-6xl mx-auto space-y-5"
    >
      <Seo title="Account Deletions" description="Customers who deleted their account from the app." />
      <PageHeader
        title="Account Deletions"
        description="Customers who deleted their account from the app. Their profile, addresses, cart, wishlist and queries are removed; past orders are kept for accounting."
      />
      <div className="card overflow-hidden">
        <div className="p-3 border-b border-line">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input className="input !pl-9" placeholder="Search name, email, user ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <DataTable columns={columns} rows={rows} isLoading={isLoading} emptyTitle="No deleted accounts" />
        <Pagination meta={meta} onPageChange={load} />
      </div>
    </motion.div>
  );
}
