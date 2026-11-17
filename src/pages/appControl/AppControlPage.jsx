import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Power, CalendarClock, Smartphone, Wrench, Bug, Gauge, Info, Bell, Mail, Globe, RotateCcw } from "lucide-react";
import { appControlApi } from "../../api/appControl.api.js";
import { getErrorMessage } from "../../api/axiosClient.js";
import { useToast } from "../../context/ToastContext.jsx";
import { formatDateTime } from "../../utils/formatters.js";
import Seo from "../../components/common/Seo.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import Badge from "../../components/common/Badge.jsx";
import Loader from "../../components/common/Loader.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import { Field, Input, Textarea, Checkbox } from "../../components/common/FormField.jsx";

const REASONS = [
  { value: "maintenance", label: "Maintenance", icon: Wrench, hint: "Planned server or app work" },
  { value: "bug", label: "Bug fix", icon: Bug, hint: "Fixing a problem in the app" },
  { value: "load", label: "High load", icon: Gauge, hint: "Too much traffic right now" },
  { value: "other", label: "Other", icon: Info, hint: "Anything else" },
];

const STATUS = {
  active: { tone: "verify", label: "Active", text: "The app is open for customers." },
  scheduled: { tone: "accent", label: "Scheduled", text: "A closure is scheduled. Customers see a heads-up banner." },
  disabled: { tone: "danger", label: "Disabled", text: "Customers see the maintenance screen instead of the shop." },
};

// <input type="datetime-local"> works in the admin's local time.
const toLocalInput = (d) => {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 16);
};
const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null);

const EMPTY = {
  reason: "maintenance",
  message: "",
  when: "now", // "now" | "later"
  startsAt: "",
  endsAt: "",
  autoEnable: true,
  notifyInApp: true,
  notifyEmail: false,
};

export default function AppControlPage() {
  const toast = useToast();
  const [view, setView] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [confirming, setConfirming] = useState(null); // "disable" | "enable"
  const [back, setBack] = useState({ notifyInApp: true, notifyEmail: false });
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    try {
      const res = await appControlApi.get();
      setView(res.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  useEffect(() => {
    load();
    // Keep the status fresh (a schedule starts / ends by itself).
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const status = view?.effective?.status || "active";
  const control = view?.control;
  const s = STATUS[status];

  // Client-side checks mirror the server's, so mistakes show before confirming.
  const problem = useMemo(() => {
    const now = Date.now();
    const start = form.when === "later" ? (form.startsAt ? new Date(form.startsAt).getTime() : null) : now;
    const end = form.endsAt ? new Date(form.endsAt).getTime() : null;
    if (form.when === "later" && !start) return "Choose when the app should close.";
    if (form.when === "later" && start <= now) return "The start time is in the past — choose “Close now” instead.";
    if (form.autoEnable && !end) return "Choose when the app should reopen, or turn off automatic reopening.";
    if (end && end <= start + 60000) return "The reopen time must be after the app closes.";
    return null;
  }, [form]);

  const disable = async () => {
    setIsSaving(true);
    try {
      const res = await appControlApi.disable({
        reason: form.reason,
        message: form.message.trim() || null,
        startsAt: form.when === "later" ? fromLocalInput(form.startsAt) : null,
        endsAt: fromLocalInput(form.endsAt),
        autoEnable: form.autoEnable,
        notifyInApp: form.notifyInApp,
        notifyEmail: form.notifyEmail,
      });
      setView(res.data.data);
      toast.success(res.data.message);
      setForm(EMPTY);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
      setConfirming(null);
    }
  };

  const enable = async () => {
    setIsSaving(true);
    try {
      const res = await appControlApi.enable(status === "disabled" ? back : {});
      setView(res.data.data);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
      setConfirming(null);
    }
  };

  if (!view) return <Loader />;

  const reasonLabel = REASONS.find((r) => r.value === control?.reason)?.label;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="max-w-4xl mx-auto space-y-5"
    >
      <Seo title="App Control" description="Open or close the customer mobile app for maintenance." />
      <PageHeader
        title="App Control"
        description="Close the customer mobile app for maintenance — now or on a schedule — and open it again. The website and this admin panel always stay open."
      />

      {/* Current status */}
      <div className={`card p-5 border-l-4 ${status === "disabled" ? "border-l-danger" : status === "scheduled" ? "border-l-accent" : "border-l-verify"}`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${status === "active" ? "bg-verify-light text-verify" : status === "scheduled" ? "bg-accent-light text-accent-dark" : "bg-danger-light text-danger"}`}>
              {status === "scheduled" ? <CalendarClock size={20} /> : <Power size={20} />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-ink">Customer app</h2>
                <Badge tone={s.tone}>{s.label}</Badge>
              </div>
              <p className="text-sm text-muted">{s.text}</p>
            </div>
          </div>
          {status !== "active" && (
            <button className="btn-primary shrink-0" onClick={() => setConfirming("enable")} disabled={isSaving}>
              <RotateCcw size={15} /> {status === "scheduled" ? "Cancel closure" : "Enable app now"}
            </button>
          )}
        </div>

        {status !== "active" && control && (
          <dl className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="flex gap-2"><dt className="text-muted w-28 shrink-0">Reason</dt><dd className="text-ink">{reasonLabel || "—"}</dd></div>
            <div className="flex gap-2"><dt className="text-muted w-28 shrink-0">{status === "scheduled" ? "Closes" : "Closed since"}</dt><dd className="text-ink">{control.startsAt ? formatDateTime(control.startsAt) : "—"}</dd></div>
            <div className="flex gap-2"><dt className="text-muted w-28 shrink-0">Back by</dt><dd className="text-ink">{control.endsAt ? formatDateTime(control.endsAt) : "Not set"}{view.effective.overdue && <span className="text-danger"> · overdue</span>}</dd></div>
            <div className="flex gap-2"><dt className="text-muted w-28 shrink-0">Reopens</dt><dd className="text-ink">{control.autoEnable ? "Automatically" : "When you enable it"}</dd></div>
            {control.message && <div className="flex gap-2 sm:col-span-2"><dt className="text-muted w-28 shrink-0">Message</dt><dd className="text-ink">{control.message}</dd></div>}
            {control.changedAt && <div className="flex gap-2 sm:col-span-2"><dt className="text-muted w-28 shrink-0">Last change</dt><dd className="text-muted">{formatDateTime(control.changedAt)}{control.changedByName ? ` by ${control.changedByName}` : ""}</dd></div>}
          </dl>
        )}
      </div>

      {/* Close / schedule form (only while the app is open) */}
      {status === "active" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!problem) setConfirming("disable");
          }}
          className="card p-5 space-y-5"
        >
          <div>
            <h3 className="font-semibold text-ink">Close the app</h3>
            <p className="text-sm text-muted">Customers will see a maintenance screen with your reason, message and the time you expect to be back.</p>
          </div>

          <Field label="Reason" required>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, reason: r.value }))}
                  className={`text-left rounded-xl border p-3 transition ${form.reason === r.value ? "border-accent bg-accent-light" : "border-line hover:bg-panel"}`}
                >
                  <r.icon size={17} className={form.reason === r.value ? "text-accent-dark" : "text-muted"} />
                  <p className="text-sm font-medium text-ink mt-1.5">{r.label}</p>
                  <p className="text-xs text-muted">{r.hint}</p>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Message for customers (optional)" hint={`${form.message.length}/500 · shown on the maintenance screen and in notifications`}>
            <Textarea value={form.message} onChange={set("message")} maxLength={500} rows={2} placeholder="We’re upgrading our systems to serve you better." />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="When">
              <div className="flex gap-2">
                {[
                  { value: "now", label: "Close now", icon: Power },
                  { value: "later", label: "Schedule", icon: CalendarClock },
                ].map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, when: o.value, startsAt: o.value === "later" && !f.startsAt ? toLocalInput(Date.now() + 3600000) : f.startsAt }))}
                    className={`btn flex-1 ${form.when === o.value ? "bg-accent-light text-accent-dark" : "btn-secondary"}`}
                  >
                    <o.icon size={15} /> {o.label}
                  </button>
                ))}
              </div>
            </Field>
            {form.when === "later" && (
              <Field label="Closes at" required>
                <Input type="datetime-local" value={form.startsAt} min={toLocalInput(Date.now())} onChange={set("startsAt")} />
              </Field>
            )}
            <Field label={form.autoEnable ? "Reopens at" : "Expected back (optional)"} required={form.autoEnable}>
              <Input type="datetime-local" value={form.endsAt} min={toLocalInput(Date.now())} onChange={set("endsAt")} />
            </Field>
          </div>

          <Checkbox label="Reopen the app automatically at that time" checked={form.autoEnable} onChange={set("autoEnable")} />

          <div className="rounded-xl bg-panel p-4 space-y-2">
            <p className="text-sm font-medium text-ink">Tell app users ({view.appUserCount} customers who use the app)</p>
            <Checkbox label={<span className="inline-flex items-center gap-1.5"><Bell size={14} /> In-app notification + phone push</span>} checked={form.notifyInApp} onChange={set("notifyInApp")} />
            <Checkbox label={<span className="inline-flex items-center gap-1.5"><Mail size={14} /> Email</span>} checked={form.notifyEmail} onChange={set("notifyEmail")} />
            <p className="text-xs text-muted">
              {form.when === "later"
                ? "They’re told now that the app will close at the scheduled time. If you chose automatic reopening, they also get a “We’re back” notice."
                : "They’re told the app is under maintenance and when it should be back."}
            </p>
          </div>

          <div className="flex items-start gap-2 text-xs text-muted">
            <Globe size={14} className="shrink-0 mt-0.5" />
            <span>While closed, the app can’t place orders, pay, or change carts and addresses (the server refuses them too). Signing in and notifications keep working. The website is not affected.</span>
          </div>

          {problem && <p className="text-sm text-danger">{problem}</p>}
          <div className="flex justify-end">
            <button className="btn-primary !bg-danger hover:!bg-danger/90" disabled={!!problem || isSaving}>
              {form.when === "later" ? <CalendarClock size={15} /> : <Power size={15} />}
              {form.when === "later" ? "Schedule closure" : "Close the app now"}
            </button>
          </div>
        </form>
      )}

      {/* Re-enable options */}
      {status === "disabled" && (
        <div className="card p-5 space-y-2">
          <p className="text-sm font-medium text-ink flex items-center gap-2"><Smartphone size={15} /> When you enable the app</p>
          <Checkbox label="Send a “We’re back” in-app notification + phone push" checked={back.notifyInApp} onChange={(e) => setBack((b) => ({ ...b, notifyInApp: e.target.checked }))} />
          <Checkbox label="Send a “We’re back” email" checked={back.notifyEmail} onChange={(e) => setBack((b) => ({ ...b, notifyEmail: e.target.checked }))} />
        </div>
      )}

      <ConfirmDialog
        open={confirming === "disable"}
        onClose={() => setConfirming(null)}
        onConfirm={disable}
        loading={isSaving}
        title={form.when === "later" ? "Schedule the app closure?" : "Close the app for all customers now?"}
        description={
          form.when === "later"
            ? `The app will close at ${form.startsAt ? formatDateTime(fromLocalInput(form.startsAt)) : "—"}${form.endsAt ? ` and ${form.autoEnable ? "reopen" : "be expected back"} at ${formatDateTime(fromLocalInput(form.endsAt))}` : ""}.`
            : `Everyone using the app will see the maintenance screen right away${form.endsAt ? ` until ${formatDateTime(fromLocalInput(form.endsAt))}` : ""}.`
        }
        confirmLabel={form.when === "later" ? "Schedule" : "Close app"}
      />
      <ConfirmDialog
        open={confirming === "enable"}
        onClose={() => setConfirming(null)}
        onConfirm={enable}
        loading={isSaving}
        danger={false}
        title={status === "scheduled" ? "Cancel the scheduled closure?" : "Open the app again?"}
        description={status === "scheduled" ? "The app stays open and the heads-up banner disappears." : "Customers will be taken back to the shop straight away."}
        confirmLabel={status === "scheduled" ? "Cancel closure" : "Enable app"}
      />
    </motion.div>
  );
}
