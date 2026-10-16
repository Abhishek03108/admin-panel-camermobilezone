import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Send, Trash2, Users, User, Search, Package } from "lucide-react";
import { notificationsApi } from "../../api/notifications.api.js";
import { productsApi } from "../../api/products.api.js";
import { getErrorMessage } from "../../api/axiosClient.js";
import { useToast } from "../../context/ToastContext.jsx";
import { formatDateTime, timeAgo } from "../../utils/formatters.js";
import Seo from "../../components/common/Seo.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import DataTable from "../../components/common/DataTable.jsx";
import Badge from "../../components/common/Badge.jsx";
import Pagination from "../../components/common/Pagination.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import { Field, Input, Textarea, Select } from "../../components/common/FormField.jsx";

const TYPES = [
  { value: "promo", label: "Offer / promotion" },
  { value: "product", label: "Product" },
  { value: "general", label: "General update" },
];

const EMPTY = { audience: "all", userEmail: "", type: "promo", title: "", body: "", link: "", imageUrl: "" };

/** Lets the admin pick a product to link to instead of typing its path. */
function ProductLinkPicker({ onPick }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (query.trim().length < 2) return setResults([]);
    const t = setTimeout(async () => {
      try {
        const res = await productsApi.list({ search: query.trim(), limit: 6 });
        setResults(res.data.data || []);
      } catch {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="relative">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input className="input !pl-9" placeholder="Search a product to link…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full card p-1 max-h-64 overflow-y-auto">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              className="w-full flex items-center gap-3 text-left px-2 py-2 rounded-lg hover:bg-panel"
              onClick={() => {
                onPick(p);
                setQuery("");
                setResults([]);
              }}
            >
              {p.images?.[0]?.imageUrl ? (
                <img src={p.images[0].imageUrl} alt="" className="w-9 h-9 rounded object-contain bg-panel" />
              ) : (
                <div className="w-9 h-9 rounded bg-panel flex items-center justify-center">
                  <Package size={15} className="text-muted" />
                </div>
              )}
              <span className="text-sm text-ink line-clamp-1">{p.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  const [form, setForm] = useState(EMPTY);
  const [isSending, setIsSending] = useState(false);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const load = async (p = page) => {
    setIsLoading(true);
    try {
      const res = await notificationsApi.list({ page: p, limit: 20 });
      setRows(res.data.data || []);
      setMeta(res.data.meta || null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    setIsSending(true);
    try {
      const payload = { ...form };
      if (payload.audience === "all") delete payload.userEmail;
      const res = await notificationsApi.send(payload);
      toast.success(res.data.message);
      setForm(EMPTY);
      setPage(1);
      load(1);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await notificationsApi.remove(deleteTarget.id);
      toast.success("Notification deleted for everyone.");
      setDeleteTarget(null);
      load(page);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: "title",
      header: "Notification",
      render: (n) => (
        <div className="max-w-md">
          <p className="font-medium text-ink">{n.title}</p>
          <p className="text-xs text-muted line-clamp-2">{n.body}</p>
          {n.link && <p className="text-xs text-accent mt-0.5 break-all">{n.link}</p>}
        </div>
      ),
    },
    {
      key: "source",
      header: "Sent by",
      render: (n) => <Badge tone={n.source === "new_product" ? "verify" : "accent"}>{n.source === "new_product" ? "Auto · new product" : "Admin"}</Badge>,
    },
    {
      key: "reach",
      header: "Opened",
      render: (n) => (
        <span className="whitespace-nowrap">
          {n.readCount} / {n.recipientCount}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Sent",
      render: (n) => (
        <span className="whitespace-nowrap" title={formatDateTime(n.createdAt)}>
          {timeAgo(n.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (n) => (
        <div className="flex justify-end">
          <button className="btn-ghost !px-2 !py-1.5 hover:!text-danger" title="Delete for everyone" onClick={() => setDeleteTarget(n)}>
            <Trash2 size={15} />
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
      <Seo title="App Notifications" description="Send in-app notifications to customers." />
      <PageHeader
        title="App Notifications"
        description={`Shows up instantly in the mobile app's notification screen (not on the website). Deleted automatically after ${meta?.retentionDays ?? 15} days.`}
        actions={meta ? <Badge tone="verify">{meta.liveConnections} app user(s) online now</Badge> : null}
      />

      <form onSubmit={handleSend} className="card p-5 space-y-4">
        <div className="flex gap-2">
          {[
            { value: "all", label: "All customers", icon: Users },
            { value: "user", label: "One customer", icon: User },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, audience: opt.value }))}
              className={`btn ${form.audience === opt.value ? "bg-accent-light text-accent-dark" : "btn-secondary"}`}
            >
              <opt.icon size={15} /> {opt.label}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {form.audience === "user" && (
            <Field label="Customer email" required>
              <Input type="email" value={form.userEmail} onChange={set("userEmail")} placeholder="customer@example.com" required />
            </Field>
          )}
          <Field label="Type">
            <Select value={form.type} onChange={set("type")}>
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Title" required hint={`${form.title.length}/150`}>
          <Input value={form.title} onChange={set("title")} maxLength={150} placeholder="Dashain offer: 10% off all iPhones" required />
        </Field>
        <Field label="Message" required hint={`${form.body.length}/1000`}>
          <Textarea value={form.body} onChange={set("body")} maxLength={1000} placeholder="Valid till Sunday. Tap to shop." required />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Opens when tapped" hint="An app path like /product/iphone-13, /shop — or pick a product below. Leave empty for none.">
            <Input value={form.link} onChange={set("link")} placeholder="/product/…" />
          </Field>
          <Field label="Image URL (optional)">
            <Input value={form.imageUrl} onChange={set("imageUrl")} placeholder="https://…" />
          </Field>
        </div>
        <ProductLinkPicker
          onPick={(p) =>
            setForm((f) => ({
              ...f,
              type: "product",
              link: `/product/${p.slug}`,
              imageUrl: f.imageUrl || p.images?.[0]?.imageUrl || "",
              title: f.title || p.name,
            }))
          }
        />

        <div className="flex justify-end">
          <button className="btn-primary" disabled={isSending}>
            <Send size={15} /> {isSending ? "Sending…" : form.audience === "all" ? "Send to all customers" : "Send"}
          </button>
        </div>
      </form>

      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-line text-sm font-medium text-ink">Sent in the last {meta?.retentionDays ?? 15} days</div>
        <DataTable
          columns={columns}
          rows={rows}
          isLoading={isLoading}
          emptyTitle="Nothing sent yet"
          emptyDescription="Broadcasts and automatic new-product notifications show up here."
        />
        <Pagination
          meta={meta}
          onPageChange={(p) => {
            setPage(p);
            load(p);
          }}
        />
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title="Delete this notification?"
        description="It will disappear from every customer's notification screen."
        confirmLabel="Delete"
      />
    </motion.div>
  );
}
