import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mail, Calendar, Filter, Copy, Check, UserCheck, UserX } from "lucide-react";
import { newsletterApi } from "../../api/newsletter.api.js";
import { getErrorMessage } from "../../api/axiosClient.js";
import { useToast } from "../../context/ToastContext.jsx";
import { formatDate } from "../../utils/formatters.js";
import Seo from "../../components/common/Seo.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import DataTable from "../../components/common/DataTable.jsx";
import Badge from "../../components/common/Badge.jsx";
import Pagination from "../../components/common/Pagination.jsx";
import { Select } from "../../components/common/FormField.jsx";

// Helper for smooth minimal loader delay to prevent layout flickering
const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [subscribed, setSubscribed] = useState("true");
  const [isLoading, setIsLoading] = useState(true);
  const [copiedEmail, setCopiedEmail] = useState(null);
  const toast = useToast();

  const load = async (p = page) => {
    setIsLoading(true);
    const start = Date.now();
    try {
      const params = { page: p, limit: 30 };
      if (subscribed !== "") params.isSubscribed = subscribed;
      const res = await newsletterApi.list(params);
      setSubscribers(res.data.data || []);
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
    setPage(1);
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribed]);

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleCopy = (email) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    toast.success("Email copied to clipboard.");
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="font-body text-ink max-w-6xl mx-auto space-y-6"
    >
      <Seo title="Newsletter" description="Newsletter subscribers." />

      <PageHeader
        title={<span className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight text-ink">Newsletter Subscribers</span>}
        description="Manage customer email subscriptions for promotional and update newsletters."
      />

      <div className="bg-white rounded-2xl border border-line shadow-2xs overflow-hidden">
        {/* Header Filters & Metadata Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 border-b border-line bg-panel/30">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-muted">
              <Filter size={14} className="text-accent" />
              <span>Status Filter</span>
            </div>

            <Select
              value={subscribed}
              onChange={(e) => setSubscribed(e.target.value)}
              className="!w-48 bg-panel/50 hover:bg-panel focus:bg-white border-line rounded-xl text-sm font-body text-ink transition-all"
            >
              <option value="true">Subscribed Only</option>
              <option value="false">Unsubscribed Only</option>
              <option value="">All Statuses</option>
            </Select>
          </div>

          <div className="text-xs font-mono font-semibold text-muted self-end sm:self-center">
            Total Records: <span className="text-ink font-bold">{meta?.total ?? meta?.totalItems ?? subscribers.length}</span>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          isLoading={isLoading}
          rows={subscribers}
          emptyTitle="No subscribers found"
          columns={[
            {
              key: "email",
              header: "Subscriber Email",
              render: (s) => (
                <div className="flex items-center gap-3 py-1 group">
                  <div className="w-9 h-9 rounded-xl bg-panel border border-line text-muted flex items-center justify-center shrink-0">
                    <Mail size={16} />
                  </div>
                  <span className="text-base font-bold font-heading text-ink">{s.email}</span>
                  <button
                    onClick={() => handleCopy(s.email)}
                    className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-panel opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    title="Copy Email Address"
                  >
                    {copiedEmail === s.email ? (
                      <Check size={14} className="text-verify" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              ),
            },
            {
              key: "subscribedAt",
              header: "Subscription Date",
              render: (s) => {
                const subDate = s.subscribedAt || s.createdAt || s.created_at;
                return (
                  <div className="flex items-center gap-1.5 text-xs font-mono text-muted">
                    <Calendar size={13} className="text-muted/70 shrink-0" />
                    <span>{subDate ? formatDate(subDate) : "—"}</span>
                  </div>
                );
              },
            },
            {
              key: "status",
              header: "Subscription Status",
              render: (s) => (
                <Badge tone={s.isSubscribed ? "verify" : "neutral"}>
                  <span className="flex items-center gap-1">
                    {s.isSubscribed ? <UserCheck size={12} /> : <UserX size={12} />}
                    {s.isSubscribed ? "Subscribed" : "Unsubscribed"}
                  </span>
                </Badge>
              ),
            },
          ]}
        />

        {/* Footer Pagination */}
        <div className="p-4 border-t border-line bg-panel/20">
          <Pagination meta={meta} onPageChange={setPage} />
        </div>
      </div>
    </motion.div>
  );
}