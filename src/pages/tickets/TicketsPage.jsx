import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Send, Mail, Phone, ShoppingBag, RefreshCw } from "lucide-react";
import { ticketsApi } from "../../api/tickets.api.js";
import { getErrorMessage } from "../../api/axiosClient.js";
import { useToast } from "../../context/ToastContext.jsx";
import { formatDateTime, timeAgo } from "../../utils/formatters.js";
import Seo from "../../components/common/Seo.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import DataTable from "../../components/common/DataTable.jsx";
import Badge from "../../components/common/Badge.jsx";
import Pagination from "../../components/common/Pagination.jsx";
import Modal from "../../components/common/Modal.jsx";
import Loader from "../../components/common/Loader.jsx";
import { Select, Textarea } from "../../components/common/FormField.jsx";

export const TICKET_STATUSES = ["Open", "In Progress", "Awaiting Customer", "Resolved", "Closed"];

const STATUS_TONE = {
  Open: "accent",
  "In Progress": "accent",
  "Awaiting Customer": "neutral",
  Resolved: "verify",
  Closed: "neutral",
};

function TicketDetail({ ticketId, onClose, onChanged }) {
  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState("");
  const [replyStatus, setReplyStatus] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef(null);
  const toast = useToast();

  const load = async () => {
    try {
      const res = await ticketsApi.get(ticketId);
      setTicket(res.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
      onClose();
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [ticket?.messages?.length]);

  const send = async () => {
    if (!reply.trim()) return;
    setIsSending(true);
    try {
      await ticketsApi.reply(ticketId, reply.trim(), replyStatus);
      toast.success("Reply sent. The customer gets an app notification and an email.");
      setReply("");
      setReplyStatus("");
      await load();
      onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSending(false);
    }
  };

  const changeStatus = async (status) => {
    try {
      await ticketsApi.setStatus(ticketId, status);
      toast.success(`Marked ${status}.`);
      await load();
      onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <Modal open onClose={onClose} title={ticket ? `${ticket.publicId} · ${ticket.subject}` : "Query"} size="xl">
      {!ticket ? (
        <Loader />
      ) : (
        <div className="space-y-4 text-sm">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="font-medium text-ink">{ticket.user?.fullName}</span>
            <a href={`mailto:${ticket.user?.email}`} className="inline-flex items-center gap-1.5 text-accent hover:underline">
              <Mail size={14} /> {ticket.user?.email}
            </a>
            <a href={`tel:${ticket.user?.mobile}`} className="inline-flex items-center gap-1.5 text-accent hover:underline">
              <Phone size={14} /> {ticket.user?.mobile}
            </a>
            {ticket.orderPublicId && (
              <Link to={`/orders?search=${ticket.orderPublicId}`} className="inline-flex items-center gap-1.5 text-accent hover:underline">
                <ShoppingBag size={14} /> {ticket.orderPublicId}
              </Link>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="neutral">{ticket.category}</Badge>
            <span className="text-xs text-muted">Raised {formatDateTime(ticket.createdAt)}</span>
            <div className="ml-auto w-48">
              <Select value={ticket.status} onChange={(e) => changeStatus(e.target.value)}>
                {TICKET_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-panel/50 p-3 space-y-3 max-h-[45vh] overflow-y-auto">
            {ticket.messages.map((m) => {
              const mine = m.senderType === "admin";
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                      mine ? "bg-accent text-white rounded-br-sm" : "bg-white border border-line text-ink rounded-bl-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    <p className={`text-[11px] mt-1 ${mine ? "text-white/80" : "text-muted"}`}>
                      {mine ? m.adminName || "Admin" : ticket.user?.fullName} · {formatDateTime(m.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {ticket.status === "Closed" ? (
            <p className="text-xs text-muted">This query is closed. Change the status to reply again.</p>
          ) : (
            <div className="space-y-2">
              <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply to the customer…" maxLength={3000} />
              <div className="flex flex-wrap items-center justify-end gap-2">
                <span className="text-xs text-muted">After replying, set status to</span>
                <div className="w-48">
                  <Select value={replyStatus} onChange={(e) => setReplyStatus(e.target.value)}>
                    <option value="">{ticket.status === "Open" ? "In Progress" : ticket.status} (default)</option>
                    {TICKET_STATUSES.filter((s) => s !== "Open").map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </Select>
                </div>
                <button className="btn-primary" disabled={isSending || !reply.trim()} onClick={send}>
                  <Send size={15} /> {isSending ? "Sending…" : "Send reply"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

export default function TicketsPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const toast = useToast();

  const load = async (p = page) => {
    setIsLoading(true);
    try {
      const params = { page: p, limit: 20 };
      if (status) params.status = status;
      if (search.trim()) params.search = search.trim();
      const res = await ticketsApi.list(params);
      setRows(res.data.data || []);
      setMeta(res.data.meta || null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    const t = setTimeout(() => load(1), search ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, search]);

  const counts = meta?.counts || {};

  const columns = [
    {
      key: "publicId",
      header: "Query ID",
      render: (t) => (
        <div className="flex items-center gap-2">
          {t.hasUnreadForAdmin && <span className="w-2 h-2 rounded-full bg-accent shrink-0" title="New message" />}
          <span className="font-mono text-xs whitespace-nowrap">{t.publicId}</span>
        </div>
      ),
    },
    {
      key: "subject",
      header: "Subject",
      render: (t) => (
        <div className="max-w-sm">
          <p className={`text-ink line-clamp-1 ${t.hasUnreadForAdmin ? "font-semibold" : "font-medium"}`}>{t.subject}</p>
          <p className="text-xs text-muted">
            {t.category}
            {t.orderPublicId ? ` · ${t.orderPublicId}` : ""}
          </p>
        </div>
      ),
    },
    {
      key: "user",
      header: "Customer",
      render: (t) => (
        <div>
          <p className="text-ink">{t.user?.fullName}</p>
          <p className="text-xs text-muted">{t.user?.email}</p>
        </div>
      ),
    },
    { key: "status", header: "Status", render: (t) => <Badge tone={STATUS_TONE[t.status]}>{t.status}</Badge> },
    {
      key: "lastMessageAt",
      header: "Last activity",
      render: (t) => (
        <span className="whitespace-nowrap" title={formatDateTime(t.lastMessageAt)}>
          {timeAgo(t.lastMessageAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (t) => (
        <div className="flex justify-end">
          <button className="btn-secondary !px-3 !py-1.5" onClick={() => setOpenId(t.id)}>
            Open
          </button>
        </div>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="max-w-6xl mx-auto space-y-5"
    >
      <Seo title="Support Queries" description="Customer queries raised from the app." />
      <PageHeader
        title="Support Queries"
        description="Raised by signed-in customers from the app. Every reply and status change notifies the customer in the app and by email."
        actions={
          <button className="btn-secondary" onClick={() => load(page)}>
            <RefreshCw size={15} /> Refresh
          </button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {["", ...TICKET_STATUSES].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setStatus(s)}
            className={`btn !py-1.5 ${status === s ? "bg-accent-light text-accent-dark" : "btn-secondary"}`}
          >
            {s || "All"}
            {s && counts[s] ? <span className="text-xs opacity-70">{counts[s]}</span> : null}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="p-3 border-b border-line">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="input !pl-9"
              placeholder="Search query ID, subject, order ID, customer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          isLoading={isLoading}
          emptyTitle="No queries"
          emptyDescription="Queries raised from the app's “Raise a query” screen show up here."
        />
        <Pagination
          meta={meta}
          onPageChange={(p) => {
            setPage(p);
            load(p);
          }}
        />
      </div>

      {openId && <TicketDetail ticketId={openId} onClose={() => setOpenId(null)} onChanged={() => load(page)} />}
    </motion.div>
  );
}
