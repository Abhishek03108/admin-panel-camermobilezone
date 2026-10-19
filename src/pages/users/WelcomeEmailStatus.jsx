import { useState } from "react";
import { MailCheck, Send, Loader2 } from "lucide-react";
import { usersApi } from "../../api/users.api.js";
import { getErrorMessage } from "../../api/axiosClient.js";
import { useToast } from "../../context/ToastContext.jsx";
import { formatDate } from "../../utils/formatters.js";
import Badge from "../../components/common/Badge.jsx";

/**
 * Welcome-email state for one customer: "Welcomed · date", or a one-time
 * "Send welcome" button. The API refuses a second welcome, so this can't
 * double-send even if two admins click at once.
 */
export default function WelcomeEmailStatus({ user, onWelcomed, block = false }) {
  const [sending, setSending] = useState(false);
  const toast = useToast();

  if (user.welcomeEmailSentAt) {
    return (
      <span className="inline-flex items-center gap-1.5" title={`Welcome email sent ${formatDate(user.welcomeEmailSentAt)}`}>
        <Badge tone="verify">
          <MailCheck size={12} className="inline -mt-0.5 mr-1" />
          Welcomed
        </Badge>
        <span className="text-xs font-mono text-muted">{formatDate(user.welcomeEmailSentAt)}</span>
      </span>
    );
  }

  if (!user.isActive) return <Badge tone="neutral">Not welcomed</Badge>;

  const send = async () => {
    setSending(true);
    try {
      const res = await usersApi.sendWelcome(user.id);
      toast.success(res.data.message || "Welcome email sent.");
      onWelcomed?.(res.data.data?.welcomeEmailSentAt || new Date().toISOString());
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={send}
      disabled={sending}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border border-accent/30 bg-accent/5 px-3 py-1.5 text-xs font-semibold text-accent-dark hover:bg-accent/10 transition-all cursor-pointer disabled:opacity-60 ${
        block ? "w-full py-2.5 text-sm" : ""
      }`}
    >
      {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
      {sending ? "Sending…" : "Send welcome email"}
    </button>
  );
}
