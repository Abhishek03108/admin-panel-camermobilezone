export function Field({ label, error, hint, required, children }) {
  return (
    <div>
      {label && (
        <label className="label">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-muted mt-1">{hint}</p>}
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}

export function Input(props) {
  return <input className="input" {...props} />;
}

export function Textarea(props) {
  return <textarea className="input min-h-[100px] resize-y" {...props} />;
}

export function Select({ children, ...props }) {
  return (
    <select className="input" {...props}>
      {children}
    </select>
  );
}

export function Checkbox({ label, ...props }) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink cursor-pointer select-none">
      <input type="checkbox" className="w-4 h-4 rounded border-line text-accent focus:ring-accent/30" {...props} />
      {label}
    </label>
  );
}

export function Switch({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors ${checked ? "bg-accent" : "bg-line"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : ""
          }`}
        />
      </button>
      {label && <span className="text-sm text-ink">{label}</span>}
    </label>
  );
}
