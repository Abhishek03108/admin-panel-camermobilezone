import { Inbox } from "lucide-react";

export default function EmptyState({ icon: Icon = Inbox, title = "Nothing here yet", description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-14 h-14 rounded-full bg-panel flex items-center justify-center mb-4">
        <Icon size={22} className="text-muted" />
      </div>
      <p className="text-lg font-semibold text-ink">{title}</p>
      {description && <p className="text-[15px] text-muted mt-1.5 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
