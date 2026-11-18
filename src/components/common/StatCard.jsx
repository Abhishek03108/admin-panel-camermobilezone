export default function StatCard({ label, value, icon: Icon, tone = "accent" }) {
  const tones = {
    accent: "bg-accent-light text-accent-dark",
    verify: "bg-verify-light text-verify",
    danger: "bg-danger-light text-danger",
    neutral: "bg-panel text-ink",
  };
  return (
    <div className="card p-6 flex items-center gap-5">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${tones[tone]}`}>
        {Icon && <Icon size={20} />}
      </div>
      <div>
        <p className="text-3xl font-semibold text-ink tabular-nums">{value}</p>
        <p className="text-sm text-muted mt-1">{label}</p>
      </div>
    </div>
  );
}
