import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, 
  Mail, 
  Phone, 
  MessageSquare, 
  Calendar, 
  Filter, 
  CheckCircle2, 
  Clock, 
  FileText,
  X,
  Loader2
} from "lucide-react";
import { contactApi } from "../../api/contact.api.js";
import { getErrorMessage } from "../../api/axiosClient.js";
import { useToast } from "../../context/ToastContext.jsx";
import { formatDateTime } from "../../utils/formatters.js";
import { CONTACT_REASONS } from "../../utils/constants.js";
import Seo from "../../components/common/Seo.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import DataTable from "../../components/common/DataTable.jsx";
import Badge from "../../components/common/Badge.jsx";
import Pagination from "../../components/common/Pagination.jsx";
import { Select } from "../../components/common/FormField.jsx";

// Helper for smooth minimal loader delay to prevent layout flickering
const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [resolved, setResolved] = useState("false");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const toast = useToast();

  const load = async (p = page) => {
    setIsLoading(true);
    const start = Date.now();
    try {
      const params = { page: p, limit: 15 };
      if (resolved !== "") params.isResolved = resolved;
      if (reason) params.reason = reason;
      const res = await contactApi.list(params);
      setMessages(res.data.data || []);
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
  }, [resolved, reason]);

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const resolve = async (id) => {
    if (processingId) return;
    setProcessingId(id);
    try {
      await contactApi.resolve(id, true);
      toast.success("Marked inquiry as resolved.");
      if (selectedMessage?.id === id) {
        setSelectedMessage((prev) => (prev ? { ...prev, isResolved: true } : null));
      }
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="font-body text-ink max-w-6xl mx-auto space-y-6"
    >
      <Seo title="Contact Messages" description="Customer messages from the contact form." />

      <PageHeader
        title={<span className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight text-ink">Contact Inquiries</span>}
        description="Review and respond to customer messages submitted via the storefront Contact Us page."
      />

      <div className="bg-white rounded-2xl border border-line shadow-2xs overflow-hidden">
        {/* Filters Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 border-b border-line bg-panel/30">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-muted">
              <Filter size={14} className="text-accent" />
              <span>Filters</span>
            </div>

            <Select
              value={resolved}
              onChange={(e) => setResolved(e.target.value)}
              className="!w-40 bg-panel/50 hover:bg-panel focus:bg-white border-line rounded-xl text-sm font-body text-ink transition-all"
            >
              <option value="false">Open Only</option>
              <option value="true font-mono">Resolved Only</option>
              <option value="">All Statuses</option>
            </Select>

            <Select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="!w-56 bg-panel/50 hover:bg-panel focus:bg-white border-line rounded-xl text-sm font-body text-ink transition-all"
            >
              <option value="">All Reasons</option>
              {CONTACT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>

          {meta?.total !== undefined && (
            <div className="text-xs font-mono font-semibold text-muted self-end sm:self-center">
              Total Inquiries: <span className="text-ink font-bold">{meta.total}</span>
            </div>
          )}
        </div>

        {/* Data Table */}
        <DataTable
          isLoading={isLoading}
          rows={messages}
          emptyTitle="No contact messages found"
          columns={[
            {
              key: "from",
              header: "Sender Details",
              render: (m) => (
                <div className="py-1 space-y-1">
                  <p className="text-base font-bold text-ink font-heading">{m.fullName || "Anonymous"}</p>
                  <div className="flex flex-col gap-0.5 text-xs text-muted font-mono">
                    <span className="flex items-center gap-1.5 truncate">
                      <Mail size={12} className="text-muted/70 shrink-0" />
                      {m.email || "No email"}
                    </span>
                    {m.mobile && (
                      <span className="flex items-center gap-1.5 truncate">
                        <Phone size={12} className="text-muted/70 shrink-0" />
                        {m.mobile}
                      </span>
                    )}
                  </div>
                </div>
              ),
            },
            {
              key: "reason",
              header: "Subject / Category",
              render: (m) => (
                <Badge tone="neutral">
                  {m.reason || "General Inquiry"}
                </Badge>
              ),
            },
            {
              key: "message",
              header: "Message Snippet",
              className: "max-w-md",
              render: (m) => (
                <div 
                  onClick={() => setSelectedMessage(m)}
                  className="group cursor-pointer py-1"
                >
                  <p className="text-sm text-ink/80 line-clamp-2 leading-relaxed group-hover:text-accent transition-colors">
                    {m.message}
                  </p>
                  <span className="text-[11px] font-mono text-accent font-semibold opacity-0 group-hover:opacity-100 transition-opacity inline-block mt-0.5">
                    Click to expand message →
                  </span>
                </div>
              ),
            },
            {
              key: "date",
              header: "Received",
              render: (m) => {
                const dateVal = m.createdAt || m.created_at;
                return (
                  <div className="flex items-center gap-1.5 text-xs font-mono text-muted">
                    <Calendar size={13} className="text-muted/70 shrink-0" />
                    <span>{dateVal ? formatDateTime(dateVal) : "—"}</span>
                  </div>
                );
              },
            },
            {
              key: "status",
              header: "Status",
              render: (m) => (
                <Badge tone={m.isResolved ? "verify" : "accent"}>
                  <span className="flex items-center gap-1">
                    {m.isResolved ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    {m.isResolved ? "Resolved" : "Open"}
                  </span>
                </Badge>
              ),
            },
            {
              key: "actions",
              header: "",
              headClassName: "text-right",
              className: "text-right",
              render: (m) =>
                !m.isResolved ? (
                  <button
                    className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-line bg-white hover:bg-accent/10 hover:border-accent/40 hover:text-accent font-semibold text-xs text-ink transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                    disabled={processingId === m.id}
                    onClick={() => resolve(m.id)}
                  >
                    {processingId === m.id ? (
                      <>
                        <Loader2 size={14} className="animate-spin text-accent" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} className="text-verify" />
                        <span>Mark Resolved</span>
                      </>
                    )}
                  </button>
                ) : (
                  <span className="text-xs font-mono text-muted italic">No action needed</span>
                ),
            },
          ]}
        />

        {/* Pagination Footer */}
        <div className="p-4 border-t border-line bg-panel/20">
          <Pagination meta={meta} onPageChange={setPage} />
        </div>
      </div>

      {/* Message Modal Preview */}
      <AnimatePresence>
        {selectedMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl border border-line shadow-xl max-w-lg w-full overflow-hidden font-body"
            >
              <div className="flex items-center justify-between p-5 border-b border-line bg-panel/30">
                <div className="flex items-center gap-2">
                  <MessageSquare size={18} className="text-accent" />
                  <h3 className="font-heading font-bold text-lg text-ink">Inquiry Details</h3>
                </div>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-panel transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 text-xs font-mono p-4 rounded-xl bg-panel/50 border border-line">
                  <div>
                    <span className="text-muted block font-body">From</span>
                    <span className="font-bold text-ink text-sm font-heading">{selectedMessage.fullName}</span>
                  </div>
                  <div>
                    <span className="text-muted block font-body">Reason</span>
                    <span className="font-bold text-ink text-sm">{selectedMessage.reason || "General"}</span>
                  </div>
                  <div>
                    <span className="text-muted block font-body">Email</span>
                    <span className="text-ink">{selectedMessage.email || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted block font-body">Mobile</span>
                    <span className="text-ink">{selectedMessage.mobile || "—"}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted mb-2">Message Body</h4>
                  <div className="p-4 rounded-xl border border-line bg-white text-sm text-ink leading-relaxed whitespace-pre-wrap">
                    {selectedMessage.message}
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-line bg-panel/20 flex items-center justify-between">
                <Badge tone={selectedMessage.isResolved ? "verify" : "accent"}>
                  {selectedMessage.isResolved ? "Resolved" : "Open Status"}
                </Badge>

                {!selectedMessage.isResolved && (
                  <button
                    className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-accent text-white hover:bg-accent/90 font-semibold text-xs transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                    disabled={processingId === selectedMessage.id}
                    onClick={() => resolve(selectedMessage.id)}
                  >
                    {processingId === selectedMessage.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                    <span>Mark as Resolved</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}