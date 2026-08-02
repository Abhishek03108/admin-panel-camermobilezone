import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  KeyRound,
  ShieldCheck,
  ShieldOff,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Lock,
  UserCheck
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { authApi } from "../../api/auth.api.js";
import { getErrorMessage } from "../../api/axiosClient.js";
import { useToast } from "../../context/ToastContext.jsx";
import { initials, formatDateTime } from "../../utils/formatters.js";
import Seo from "../../components/common/Seo.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import { Field, Input } from "../../components/common/FormField.jsx";
import Modal from "../../components/common/Modal.jsx";

// Helper for smooth minimal loader delay to prevent layout flickering
const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

export default function SettingsPage() {
  const { admin, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }
    setIsSaving(true);
    try {
      await authApi.changePassword(passwords.currentPassword, passwords.newPassword);
      toast.success("Password changed successfully. Please log in again.");
      await logout();
      navigate("/login");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="font-body text-ink max-w-5xl mx-auto space-y-6"
    >
      <Seo title="Settings" description="Manage your admin account settings." />
      <PageHeader
        title={<span className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight text-ink">Account Settings</span>}
        description="Manage your security credentials, personal identity overview, and two-factor authentication."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Details Card */}
        <div className="bg-white rounded-2xl border border-line shadow-2xs p-6 text-center flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-accent/10 text-accent font-heading font-extrabold flex items-center justify-center text-2xl border border-accent/20 mb-4 shadow-2xs">
            {initials(admin?.fullName)}
          </div>
          <h2 className="text-lg font-bold font-heading text-ink">{admin?.fullName}</h2>
          <p className="text-xs font-mono text-muted mt-1">{admin?.email}</p>

          <div className="w-full border-t border-line mt-5 pt-4 space-y-2 text-left">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-muted">Account ID:</span>
              <span className="text-ink font-semibold">{admin?.publicId || "N/A"}</span>
            </div>
            {admin?.lastLoginAt && (
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted">Last Active:</span>
                <span className="text-ink font-semibold">{formatDateTime(admin.lastLoginAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Change Password Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-line shadow-2xs p-6">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound size={18} className="text-accent" />
            <h3 className="text-base font-bold font-heading text-ink">Change Password</h3>
          </div>
          <p className="text-xs text-muted font-body mb-6">
            Updating your password will automatically end active sessions on all other devices.
          </p>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <Field label="Current Password" required>
              <Input
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
                required
                placeholder="••••••••"
              />
            </Field>

            <Field label="New Password" required hint="At least 8 characters with letters and numbers.">
              <Input
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                required
                placeholder="••••••••"
              />
            </Field>

            <Field label="Confirm New Password" required>
              <Input
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))}
                required
                placeholder="••••••••"
              />
            </Field>

            <div className="pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-accent text-white hover:bg-accent/90 font-semibold text-xs transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                disabled={isSaving}
              >
                {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
                <span>{isSaving ? "Updating Password..." : "Update Password"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Two-Factor Authentication Card */}
        <div className="lg:col-span-3">
          <TwoFactorCard />
        </div>
      </div>
    </motion.div>
  );
}

function TwoFactorCard() {
  const toast = useToast();
  const [enabled, setEnabled] = useState(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const loadStatus = async () => {
    const start = Date.now();
    try {
      const res = await authApi.getTwoFactorStatus();
      setEnabled(res.data.data.enabled);
    } catch {
      setEnabled(false);
    } finally {
      const elapsed = Date.now() - start;
      if (elapsed < 350) await delay(350 - elapsed);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const startSetup = async () => {
    setIsBusy(true);
    try {
      const res = await authApi.setupTwoFactor();
      setMaskedEmail(res.data.data.maskedEmail);
      setSetupOpen(true);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  };

  const confirmEnable = async () => {
    setIsBusy(true);
    try {
      await authApi.enableTwoFactor(code);
      toast.success("Two-factor authentication enabled successfully.");
      setSetupOpen(false);
      setCode("");
      loadStatus();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  };

  const confirmDisable = async () => {
    setIsBusy(true);
    try {
      await authApi.disableTwoFactor(password);
      toast.success("Two-factor authentication disabled.");
      setDisableOpen(false);
      setPassword("");
      loadStatus();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-line shadow-2xs p-6">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck size={18} className="text-accent" />
        <h3 className="text-base font-bold font-heading text-ink">Two-Factor Authentication (2FA)</h3>
      </div>
      <p className="text-xs text-muted font-body mb-5">
        Enhance account security. When active, logging in requires entering a verification code sent to your email.
      </p>

      {enabled === null ? (
        <div className="flex items-center gap-2 text-xs font-mono text-muted py-2">
          <Loader2 size={14} className="animate-spin text-accent" />
          <span>Verifying security status...</span>
        </div>
      ) : enabled ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <div className="flex items-center gap-2.5 text-emerald-700 text-xs font-semibold">
            <UserCheck size={16} />
            <span>2FA Security Layer Enabled</span>
          </div>
          <button
            className="py-1.5 px-3 rounded-xl border border-line bg-white hover:bg-panel text-muted hover:text-ink font-semibold text-xs transition-all cursor-pointer shadow-2xs"
            onClick={() => setDisableOpen(true)}
          >
            <span className="flex items-center gap-1.5">
              <ShieldOff size={14} /> Disable 2FA
            </span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-line bg-panel/30 px-4 py-3">
          <div className="flex items-center gap-2.5 text-muted text-xs font-medium">
            <ShieldAlert size={16} className="text-amber-500" />
            <span>2FA Protection Disabled</span>
          </div>
          <button
            className="py-1.5 px-4 rounded-xl bg-accent text-white hover:bg-accent/90 font-semibold text-xs transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            onClick={startSetup}
            disabled={isBusy}
          >
            {isBusy ? "Initiating..." : "Enable 2FA"}
          </button>
        </div>
      )}

      {/* Setup 2FA Modal */}
      <Modal
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        title="Confirm Two-Factor Authentication"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              className="py-2 px-4 rounded-xl border border-line text-xs font-semibold hover:bg-panel transition-all cursor-pointer"
              onClick={() => setSetupOpen(false)}
            >
              Cancel
            </button>
            <button
              className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-accent text-white hover:bg-accent/90 font-semibold text-xs transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              onClick={confirmEnable}
              disabled={isBusy || code.length !== 6}
            >
              {isBusy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              <span>{isBusy ? "Verifying..." : "Confirm & Enable"}</span>
            </button>
          </div>
        }
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-xs text-muted leading-relaxed font-body">
            A 6-digit verification code has been dispatched to{" "}
            <span className="font-mono font-semibold text-ink">{maskedEmail}</span>. Enter the code below to finalize setup.
          </p>
          <input
            autoFocus
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="py-2.5 px-4 text-center text-xl font-mono tracking-[0.5em] rounded-xl border border-line bg-panel focus:outline-none focus:border-accent w-52 shadow-2xs"
          />
        </div>
      </Modal>

      {/* Disable 2FA Modal */}
      <Modal
        open={disableOpen}
        onClose={() => setDisableOpen(false)}
        title="Disable Two-Factor Authentication"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              className="py-2 px-4 rounded-xl border border-line text-xs font-semibold hover:bg-panel transition-all cursor-pointer"
              onClick={() => setDisableOpen(false)}
            >
              Cancel
            </button>
            <button
              className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-danger text-white hover:bg-danger/90 font-semibold text-xs transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              onClick={confirmDisable}
              disabled={isBusy || !password}
            >
              {isBusy ? <Loader2 size={14} className="animate-spin" /> : <ShieldOff size={14} />}
              <span>{isBusy ? "Disabling..." : "Disable 2FA"}</span>
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-muted font-body">
            Please enter your password to confirm disabling two-factor security protection on your account.
          </p>
          <Field label="Account Password" required>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              placeholder="••••••••"
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}