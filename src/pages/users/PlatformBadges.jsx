import { Smartphone, Globe } from "lucide-react";
import { timeAgo, formatDateTime } from "../../utils/formatters.js";

/** "App", "Website" or both — with when each was last used. */
export default function PlatformBadges({ user, showLast = true }) {
  const usesApp = !!user.firstAppSeenAt;
  const usesWeb = !!user.firstWebSeenAt;
  if (!usesApp && !usesWeb) return <span className="text-xs text-muted">Not seen yet</span>;

  const pill = (Icon, label, last, cls) => (
    <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold ${cls}`} title={last ? `Last active ${formatDateTime(last)}` : label}>
      <Icon size={12} /> {label}
      {showLast && last && <span className="font-normal opacity-75">· {timeAgo(last)}</span>}
    </span>
  );

  return (
    <div className="flex flex-col gap-1 items-start">
      {usesApp && pill(Smartphone, "App", user.lastAppActiveAt, "bg-accent-light text-accent-dark")}
      {usesWeb && pill(Globe, "Website", user.lastWebActiveAt, "bg-panel text-ink border border-line")}
    </div>
  );
}
