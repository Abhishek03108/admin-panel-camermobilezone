export default function StatCard({ label, value, icon: Icon, tone = "accent" }) {
  const tones = {
    accent: "bg-accent-light text-accent-dark",
    verify: "bg-verify-light text-verify",
    danger: "bg-danger-light text-danger",
    neutral: "bg-panel text-ink",
  };
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tones[tone]}`}>
        {Icon && <Icon size={20} />}
      </div>
      <div>
        <p className="text-2xl font-semibold text-ink leading-tight">{value}</p>
        <p className="text-xs text-muted mt-0.5">{label}</p>
      </div>
    </div>
  );
}
