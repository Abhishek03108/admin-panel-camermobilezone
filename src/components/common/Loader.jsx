import { Loader2 } from "lucide-react";

export default function Loader({ label = "Loading…", full = false }) {
  return (
    <div className={`flex items-center justify-center gap-2 text-muted text-sm ${full ? "min-h-[50vh]" : "py-12"}`}>
      <Loader2 size={18} className="animate-spin" />
      <span>{label}</span>
    </div>
  );
}
