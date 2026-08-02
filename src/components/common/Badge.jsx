const TONES = {
  neutral: "bg-panel text-muted border border-line",
  accent: "bg-accent-light text-accent-dark",
  verify: "bg-verify-light text-verify",
  danger: "bg-danger-light text-danger",
};

export default function Badge({ tone = "neutral", children }) {
  return <span className={`badge ${TONES[tone] || TONES.neutral}`}>{children}</span>;
}
