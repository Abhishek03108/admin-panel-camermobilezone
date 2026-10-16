import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send, FlaskConical, X, Search, Loader2, Users, Mail, UserPlus, AtSign } from "lucide-react";
import { emailsApi } from "../../api/emails.api.js";
import { usersApi } from "../../api/users.api.js";
import { getErrorMessage } from "../../api/axiosClient.js";
import { useToast } from "../../context/ToastContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { formatDateTime } from "../../utils/formatters.js";
import Seo from "../../components/common/Seo.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import DataTable from "../../components/common/DataTable.jsx";
import Badge from "../../components/common/Badge.jsx";
import Pagination from "../../components/common/Pagination.jsx";
import Modal from "../../components/common/Modal.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import { Field, Input, Textarea, Checkbox } from "../../components/common/FormField.jsx";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STATUS_TONES = { sending: "accent", sent: "verify", partial: "accent", failed: "danger", interrupted: "danger" };
const STATUS_LABELS = { sending: "Sending…", sent: "Sent", partial: "Partly sent", failed: "Failed", interrupted: "Interrupted" };
const AUDIENCE_LABELS = {
  users: "All users",
  subscribers: "Newsletter subscribers",
  everyone: "Users + subscribers",
  none: "Only chosen people",
};

const EMPTY_FORM = { subject: "", message: "", ctaLabel: "", ctaUrl: "" };

function parseEmails(text) {
  return [...new Set(text.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean))];
}

export default function SendEmailPage() {
  const toast = useToast();
  const { admin } = useAuth();

  const [form, setForm] = useState(EMPTY_FORM);
  const [showButton, setShowButton] = useState(false);
  const [audience, setAudience] = useState("users");
  const [respectOptOut, setRespectOptOut] = useState(true);
  const [pickedUsers, setPickedUsers] = useState([]);
  const [extraText, setExtraText] = useState("");

  const [summary, setSummary] = useState(null);
  const [recipientCount, setRecipientCount] = useState(null);
  const [isCounting, setIsCounting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [history, setHistory] = useState([]);
  const [historyMeta, setHistoryMeta] = useState(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  const extraEmails = useMemo(() => parseEmails(extraText), [extraText]);
  const invalidEmails = extraEmails.filter((e) => !EMAIL_PATTERN.test(e));
  const validExtraEmails = extraEmails.filter((e) => EMAIL_PATTERN.test(e));

  const recipients = useMemo(
    () => ({ audience, respectOptOut, userIds: pickedUsers.map((u) => u.id), extraEmails: validExtraEmails }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [audience, respectOptOut, pickedUsers, validExtraEmails.join(",")]
  );

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const payload = () => ({
    ...form,
    ctaLabel: showButton ? form.ctaLabel : "",
    ctaUrl: showButton ? form.ctaUrl : "",
  });

  const loadHistory = async (page = historyPage, { quiet = false } = {}) => {
    if (!quiet) setIsHistoryLoading(true);
    try {
      const res = await emailsApi.history({ page, limit: 10 });
      setHistory(res.data.data || []);
      setHistoryMeta(res.data.meta || null);
    } catch (err) {
      if (!quiet) toast.error(getErrorMessage(err));
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    emailsApi
      .audience()
      .then((res) => setSummary(res.data.data))
      .catch((err) => toast.error(getErrorMessage(err)));
    loadHistory(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live recipient count (debounced).
  useEffect(() => {
    setIsCounting(true);
    const timer = setTimeout(async () => {
      try {
        const res = await emailsApi.countRecipients(recipients);
        setRecipientCount(res.data.data.count);
      } catch {
        setRecipientCount(null);
      } finally {
        setIsCounting(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [recipients]);

  // Refresh history while something is being sent.
  const isAnySending = history.some((h) => h.status === "sending");
  useEffect(() => {
    if (!isAnySending) return;
    const interval = setInterval(() => loadHistory(historyPage, { quiet: true }), 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnySending, historyPage]);

  const validate = () => {
    if (!form.subject.trim()) return "Please enter a subject.";
    if (!form.message.trim()) return "Please write a message.";
    if (showButton && (!form.ctaLabel.trim() || !/^https?:\/\//i.test(form.ctaUrl.trim()))) {
      return "Please fill in the button text and a full link starting with https://";
    }
    if (invalidEmails.length) return `These email addresses are not valid: ${invalidEmails.join(", ")}`;
    return null;
  };

  const handleTest = async () => {
    const problem = validate();
    if (problem) return toast.error(problem);
    setIsTesting(true);
    try {
      const res = await emailsApi.sendTest(payload());
      toast.success(res.data.message);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsTesting(false);
    }
  };

  const openConfirm = () => {
    const problem = validate();
    if (problem) return toast.error(problem);
    if (!recipientCount) return toast.error("Nobody would receive this email. Choose a group, pick users or add emails.");
    setConfirmOpen(true);
  };

  const handleSend = async () => {
    setIsSending(true);
    try {
      const res = await emailsApi.send({ ...payload(), ...recipients });
      toast.success(res.data.message);
      setConfirmOpen(false);
      setForm(EMPTY_FORM);
      setShowButton(false);
      setPickedUsers([]);
      setExtraText("");
      setHistoryPage(1);
      loadHistory(1);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSending(false);
    }
  };

  const audienceOptions = [
    {
      key: "users",
      label: "All users",
      count: summary ? (respectOptOut ? summary.usersAllowingPromo : summary.users) : null,
      icon: Users,
    },
    { key: "subscribers", label: "Newsletter subscribers", count: summary?.subscribers, icon: Mail },
    { key: "everyone", label: "Users + subscribers", count: null, icon: Users },
    { key: "none", label: "Only the people I add below", count: null, icon: UserPlus },
  ];

  const columns = [
    { key: "createdAt", header: "Sent on", render: (r) => <span className="whitespace-nowrap">{formatDateTime(r.createdAt)}</span> },
    { key: "subject", header: "Subject", render: (r) => <span className="font-medium text-ink line-clamp-1">{r.subject}</span> },
    { key: "audience", header: "To", render: (r) => <span className="text-muted whitespace-nowrap">{AUDIENCE_LABELS[r.audience] || r.audience}</span> },
    {
      key: "progress",
      header: "Delivered",
      render: (r) => (
        <span className="whitespace-nowrap">
          {r.sentCount} / {r.recipientCount}
          {r.failedCount > 0 && <span className="text-danger"> · {r.failedCount} failed</span>}
        </span>
      ),
    },
    { key: "status", header: "Status", render: (r) => <Badge tone={STATUS_TONES[r.status]}>{STATUS_LABELS[r.status] || r.status}</Badge> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <button className="btn-ghost !px-2.5 !py-1.5" onClick={() => emailsApi.get(r.id).then((res) => setDetail(res.data.data))}>
          View
        </button>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="max-w-5xl mx-auto space-y-5"
    >
      <Seo title="Send Email" description="Email your customers, subscribers or anyone you choose." />
      <PageHeader title="Send Email" description="Write once and send to your customers, newsletter subscribers or any address you add." />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Compose */}
        <div className="card p-5 space-y-4 lg:col-span-3">
          <h2 className="text-sm font-semibold text-ink">Message</h2>
          <Field label="Subject" required>
            <Input value={form.subject} onChange={set("subject")} maxLength={200} placeholder="e.g. Dashain offers are live!" />
          </Field>
          <Field label="Message" required hint="Leave an empty line to start a new paragraph. {name} becomes the customer's name.">
            <Textarea
              value={form.message}
              onChange={set("message")}
              rows={10}
              className="input min-h-[220px] resize-y"
              placeholder={"Hello {name},\n\nWe have new arrivals this week…"}
            />
          </Field>

          <Checkbox label="Add a button (e.g. Shop now)" checked={showButton} onChange={(e) => setShowButton(e.target.checked)} />
          {showButton && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Button text">
                <Input value={form.ctaLabel} onChange={set("ctaLabel")} maxLength={60} placeholder="Shop now" />
              </Field>
              <Field label="Button link">
                <Input value={form.ctaUrl} onChange={set("ctaUrl")} placeholder="https://www.cameramobilezone.com/products" />
              </Field>
            </div>
          )}
        </div>

        {/* Recipients */}
        <div className="card p-5 space-y-4 lg:col-span-2">
          <h2 className="text-sm font-semibold text-ink">Send to</h2>
          <div className="space-y-2">
            {audienceOptions.map((opt) => (
              <label
                key={opt.key}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                  audience === opt.key ? "border-accent bg-accent-light/40" : "border-line hover:bg-panel"
                }`}
              >
                <input
                  type="radio"
                  name="audience"
                  className="text-accent focus:ring-accent/30"
                  checked={audience === opt.key}
                  onChange={() => setAudience(opt.key)}
                />
                <opt.icon size={15} className="text-muted shrink-0" />
                <span className="text-sm text-ink flex-1">{opt.label}</span>
                {opt.count !== null && opt.count !== undefined && <span className="text-xs text-muted">{opt.count}</span>}
              </label>
            ))}
          </div>

          {(audience === "users" || audience === "everyone") && (
            <Checkbox
              label="Skip users who turned off promotional emails"
              checked={respectOptOut}
              onChange={(e) => setRespectOptOut(e.target.checked)}
            />
          )}

          <UserPicker picked={pickedUsers} onChange={setPickedUsers} />

          <Field
            label="Extra email addresses"
            hint="Anyone else — separate with commas, spaces or new lines."
            error={invalidEmails.length ? `Not valid: ${invalidEmails.join(", ")}` : null}
          >
            <Textarea value={extraText} onChange={(e) => setExtraText(e.target.value)} rows={3} placeholder="friend@gmail.com, shop@example.com" />
          </Field>
        </div>
      </div>

      {/* Send bar */}
      <div className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-ink flex-1">
          <AtSign size={16} className="text-accent" />
          {isCounting ? (
            <span className="text-muted">Counting recipients…</span>
          ) : (
            <span>
              This email will go to <strong>{recipientCount ?? "—"}</strong> {recipientCount === 1 ? "person" : "people"}.
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={handleTest} disabled={isTesting}>
            {isTesting ? <Loader2 size={15} className="animate-spin" /> : <FlaskConical size={15} />}
            Send test to me
          </button>
          <button className="btn-primary" onClick={openConfirm} disabled={isSending || isAnySending}>
            <Send size={15} /> {isAnySending ? "Another email is sending…" : "Send email"}
          </button>
        </div>
      </div>

      {/* History */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-line">
          <h2 className="text-sm font-semibold text-ink">Sent emails</h2>
        </div>
        <DataTable
          columns={columns}
          rows={history}
          isLoading={isHistoryLoading}
          emptyTitle="Nothing sent yet"
          emptyDescription="Emails you send from this page will show up here."
        />
        <Pagination
          meta={historyMeta}
          onPageChange={(p) => {
            setHistoryPage(p);
            loadHistory(p);
          }}
        />
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleSend}
        loading={isSending}
        danger={false}
        title={`Send to ${recipientCount} ${recipientCount === 1 ? "person" : "people"}?`}
        description={`"${form.subject}" will be emailed now. This can't be undone. Tip: send a test to ${admin?.email || "yourself"} first.`}
        confirmLabel="Send now"
      />

      <CampaignDetail campaign={detail} onClose={() => setDetail(null)} />
    </motion.div>
  );
}

function UserPicker({ picked, onChange }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await usersApi.list({ search: query.trim(), limit: 8 });
        setResults(res.data.data || []);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const close = (e) => boxRef.current && !boxRef.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const add = (user) => {
    if (!picked.some((p) => p.id === user.id)) onChange([...picked, user]);
    setQuery("");
    setOpen(false);
  };

  return (
    <Field label="Add specific users" hint="Picked users always get the email.">
      <div ref={boxRef} className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          className="input pl-9"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search name, email or mobile"
        />
        {open && query.trim().length >= 2 && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-line rounded-lg shadow-popover max-h-64 overflow-y-auto">
            {isSearching ? (
              <p className="px-3 py-2 text-sm text-muted">Searching…</p>
            ) : results.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted">No users found</p>
            ) : (
              results.map((u) => (
                <button key={u.id} type="button" onClick={() => add(u)} className="w-full text-left px-3 py-2 hover:bg-panel">
                  <p className="text-sm text-ink">{u.fullName}</p>
                  <p className="text-xs text-muted">{u.email}</p>
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {picked.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {picked.map((u) => (
            <span key={u.id} className="badge bg-panel text-ink border border-line">
              {u.fullName}
              <button type="button" onClick={() => onChange(picked.filter((p) => p.id !== u.id))} className="text-muted hover:text-danger">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </Field>
  );
}

function CampaignDetail({ campaign, onClose }) {
  if (!campaign) return null;
  return (
    <Modal open={!!campaign} onClose={onClose} title={campaign.subject} size="lg">
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ["Sent on", formatDateTime(campaign.createdAt)],
            ["To", AUDIENCE_LABELS[campaign.audience] || campaign.audience],
            ["Delivered", `${campaign.sentCount} / ${campaign.recipientCount}`],
            ["Status", STATUS_LABELS[campaign.status] || campaign.status],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-muted">{label}</p>
              <p className="text-ink">{value}</p>
            </div>
          ))}
        </div>
        {campaign.extraEmails?.length > 0 && (
          <div>
            <p className="text-xs text-muted mb-1">Extra addresses</p>
            <p className="text-ink break-words">{campaign.extraEmails.join(", ")}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-muted mb-1">Message</p>
          <div className="rounded-lg border border-line bg-panel/50 p-3 whitespace-pre-wrap text-ink">{campaign.message}</div>
        </div>
        {campaign.ctaLabel && (
          <p className="text-muted">
            Button: <span className="text-ink">{campaign.ctaLabel}</span> → {campaign.ctaUrl}
          </p>
        )}
        {campaign.failedEmails?.length > 0 && (
          <div>
            <p className="text-xs text-danger mb-1">Failed ({campaign.failedCount})</p>
            <ul className="max-h-40 overflow-y-auto space-y-1">
              {campaign.failedEmails.map((f) => (
                <li key={f.email} className="text-xs">
                  <span className="text-ink">{f.email}</span> <span className="text-muted">— {f.error}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}
