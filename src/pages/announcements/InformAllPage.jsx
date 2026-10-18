import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Megaphone, FlaskConical, Send, Loader2, X, ExternalLink, ImageOff, Users } from "lucide-react";
import { announcementsApi } from "../../api/announcements.api.js";
import { getErrorMessage } from "../../api/axiosClient.js";
import { useToast } from "../../context/ToastContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { formatCurrency, formatDateTime } from "../../utils/formatters.js";
import Seo from "../../components/common/Seo.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import Badge from "../../components/common/Badge.jsx";
import Loader from "../../components/common/Loader.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import Modal from "../../components/common/Modal.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import { Field, Input, Textarea } from "../../components/common/FormField.jsx";

const STOREFRONT = "https://www.cameramobilezone.com";
const STATUS = {
  sending: ["accent", "Sending…"],
  sent: ["verify", "Emailed"],
  partial: ["accent", "Partly sent"],
  failed: ["danger", "Failed"],
  interrupted: ["danger", "Interrupted"],
};

export default function InformAllPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [recipientCount, setRecipientCount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [composing, setComposing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const load = async ({ quiet = false } = {}) => {
    if (!quiet) setIsLoading(true);
    try {
      const res = await announcementsApi.list();
      setItems(res.data.data.items || []);
      setRecipientCount(res.data.data.recipientCount);
    } catch (err) {
      if (!quiet) toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep progress fresh while an email is going out.
  const isAnySending = items.some((i) => i.lastSend?.status === "sending");
  useEffect(() => {
    if (!isAnySending) return;
    const interval = setInterval(() => load({ quiet: true }), 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnySending]);

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await announcementsApi.dismiss(removing.product.id);
      toast.success("Removed from Inform All.");
      setRemoving(null);
      load({ quiet: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="max-w-5xl mx-auto space-y-5"
    >
      <Seo title="Inform All" description="Email every customer about newly added products." />
      <PageHeader
        title="Inform All"
        description="New products show up here automatically. Press Notify all to email the product's photos and full details to everyone."
      />

      <div className="card p-4 flex items-center gap-3 text-sm">
        <Users size={18} className="text-accent shrink-0" />
        <span className="text-ink">
          Notify all sends to <strong>{recipientCount ?? "—"}</strong> people — all users and newsletter subscribers,
          except those who unsubscribed from promotional emails.
        </span>
      </div>

      {isLoading ? (
        <Loader />
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No new products"
            description="When you add a product, it appears here so you can tell your customers about it."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <AnnouncementCard
              key={item.id}
              item={item}
              disabled={isAnySending}
              onNotify={() => setComposing(item)}
              onRemove={() => setRemoving(item)}
            />
          ))}
        </div>
      )}

      {composing && (
        <NotifyModal
          item={composing}
          recipientCount={recipientCount}
          onClose={() => setComposing(null)}
          onSent={() => {
            setComposing(null);
            load({ quiet: true });
          }}
        />
      )}

      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={handleRemove}
        loading={isRemoving}
        title="Remove from Inform All?"
        description={`"${removing?.product.name}" will be removed from this list. Nobody is emailed and the product stays on the website.`}
        confirmLabel="Remove"
      />
    </motion.div>
  );
}

function AnnouncementCard({ item, disabled, onNotify, onRemove }) {
  const { product, lastSend, sendCount } = item;
  const [tone, label] = lastSend ? STATUS[lastSend.status] || ["accent", lastSend.status] : ["accent", "Not sent yet"];
  const discounted = Number(product.originalPrice) > Number(product.sellingPrice);

  return (
    <div className="card p-4 flex flex-col sm:flex-row gap-4">
      <div className="w-full sm:w-28 h-40 sm:h-28 rounded-xl border border-line bg-white overflow-hidden flex items-center justify-center shrink-0">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt="" className="w-full h-full object-contain" />
        ) : (
          <ImageOff size={22} className="text-muted" />
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-ink">{product.name}</h3>
          <Badge tone={tone}>{label}</Badge>
          {!product.isActive && <Badge tone="danger">Hidden on website</Badge>}
        </div>
        <p className="text-sm">
          <span className="font-semibold text-ink">{formatCurrency(product.sellingPrice)}</span>
          {discounted && <span className="ml-2 text-muted line-through">{formatCurrency(product.originalPrice)}</span>}
          <span className="text-muted"> · {product.condition} · {product.stock} in stock</span>
        </p>
        <p className="text-xs text-muted">
          Added {formatDateTime(product.createdAt)} · {product.imageCount} photo{product.imageCount === 1 ? "" : "s"}
        </p>
        {lastSend && (
          <p className="text-xs text-muted">
            Last emailed {formatDateTime(lastSend.createdAt)} — {lastSend.sentCount} / {lastSend.recipientCount} delivered
            {lastSend.failedCount > 0 && <span className="text-danger"> · {lastSend.failedCount} failed</span>}
            {sendCount > 1 && ` · sent ${sendCount} times`}
          </p>
        )}
        {product.imageCount === 0 && (
          <p className="text-xs text-danger">This product has no photo — add one before notifying customers.</p>
        )}
      </div>

      <div className="flex sm:flex-col gap-2 sm:w-40 shrink-0">
        <button className="btn-primary flex-1 sm:flex-none" onClick={onNotify} disabled={disabled || !product.isActive}>
          <Megaphone size={15} /> {lastSend ? "Notify again" : "Notify all"}
        </button>
        <a
          className="btn-secondary flex-1 sm:flex-none"
          href={`${STOREFRONT}/products/${product.slug}`}
          target="_blank"
          rel="noreferrer"
        >
          <ExternalLink size={15} /> View
        </a>
        <Link className="btn-ghost flex-1 sm:flex-none" to={`/products/${product.id}`}>
          Edit product
        </Link>
        <button className="btn-ghost flex-1 sm:flex-none hover:!text-danger" onClick={onRemove}>
          <X size={15} /> Remove
        </button>
      </div>
    </div>
  );
}

function NotifyModal({ item, recipientCount, onClose, onSent }) {
  const toast = useToast();
  const { admin } = useAuth();
  const [subject, setSubject] = useState(item.defaultSubject);
  const [intro, setIntro] = useState(item.defaultIntro);
  const [isTesting, setIsTesting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const payload = { subject: subject.trim(), intro: intro.trim() };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const res = await announcementsApi.sendTest(item.product.id, payload);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsTesting(false);
    }
  };

  const handleSend = async () => {
    setIsSending(true);
    try {
      const res = await announcementsApi.send(item.product.id, payload);
      toast.success(res.data.message);
      onSent();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setConfirming(false);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={`Notify all: ${item.product.name}`}
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={handleTest} disabled={isTesting || !subject.trim()}>
              {isTesting ? <Loader2 size={15} className="animate-spin" /> : <FlaskConical size={15} />}
              Send test to me
            </button>
            <button className="btn-primary" onClick={() => setConfirming(true)} disabled={!subject.trim() || !intro.trim()}>
              <Send size={15} /> Send to {recipientCount ?? "…"} people
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            The email includes the product's photos, price, condition, warranty, all specifications, a “View product”
            button and an Unsubscribe link at the bottom.
          </p>
          <Field label="Subject" required>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} />
          </Field>
          <Field label="Opening message" hint="Shown above the product. {name} becomes each customer's name.">
            <Textarea value={intro} onChange={(e) => setIntro(e.target.value)} rows={4} maxLength={5000} />
          </Field>
          <p className="text-xs text-muted">Tip: send a test to {admin?.email || "yourself"} first to check how it looks.</p>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={handleSend}
        loading={isSending}
        danger={false}
        title={`Email ${recipientCount} people about ${item.product.name}?`}
        description="This can't be undone. Emails go out in the background — you can leave this page."
        confirmLabel="Send now"
      />
    </>
  );
}
