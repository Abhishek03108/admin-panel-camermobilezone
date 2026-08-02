import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../api/auth.api.js";
import { getErrorMessage } from "../../api/axiosClient.js";
import Seo from "../../components/common/Seo.jsx";
import { bodyFont, headingFont, monoFont } from "../../font.js";

const delay = (ms = 1200) => new Promise((resolve) => setTimeout(resolve, ms));

export default function ForgotPassword() {
  const [step, setStep] = useState("request"); // request | verify | reset | done
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [ticket, setTicket] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Snackbar Toast Notification State
  const [toast, setToast] = useState({ message: "", type: "" }); // type: 'error' | 'success' | 'info'
  const [submitting, setSubmitting] = useState(false);

  // 30-Second OTP Timer State
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const otpInputsRef = useRef([]);
  const navigate = useNavigate();

  // Show Toast Helper
  const showToast = (message, type = "error") => {
    setToast({ message, type });
  };

  // Auto-dismiss toast notification after 4 seconds
  useEffect(() => {
    if (toast.message) {
      const timerId = setTimeout(() => {
        setToast({ message: "", type: "" });
      }, 4000);
      return () => clearTimeout(timerId);
    }
  }, [toast]);

  // Handle 30-Second Timer logic when on 'verify' step
  useEffect(() => {
    let interval = null;
    if (step === "verify" && timer > 0) {
      setCanResend(false);
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, timer]);

  // Focus first OTP field when entering verify step
  useEffect(() => {
    if (step === "verify" && otpInputsRef.current[0]) {
      otpInputsRef.current[0].focus();
    }
  }, [step]);

  // STEP 1: Request OTP Handler
  const handleRequest = async (e) => {
    if (e) e.preventDefault();
    if (submitting) return;
    setToast({ message: "", type: "" });
    setSubmitting(true);
    try {
      await Promise.all([
        authApi.requestPasswordResetOtp(email.trim()),
        delay(),
      ]);
      setStep("verify");
      setTimer(30);
      setCanResend(false);
      showToast("Verification code sent to your email address.", "info");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  // OTP Box Change Handler
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-advance cursor
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Auto trigger verification when all 6 fields are populated
    const fullCode = newOtp.join("");
    if (fullCode.length === 6) {
      executeVerify(fullCode);
    }
  };

  // OTP Backspace Handling
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // OTP Paste Handling
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim().slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const digits = pastedData.split("");
    const newOtp = [...otp];
    digits.forEach((digit, idx) => {
      if (idx < 6) newOtp[idx] = digit;
    });
    setOtp(newOtp);

    const nextFocusIndex = Math.min(digits.length, 5);
    otpInputsRef.current[nextFocusIndex]?.focus();

    if (newOtp.join("").length === 6) {
      executeVerify(newOtp.join(""));
    }
  };

  // STEP 2: Verify OTP
  const executeVerify = async (codeToVerify) => {
    if (submitting) return;
    setToast({ message: "", type: "" });
    setSubmitting(true);
    try {
      const [res] = await Promise.all([
        authApi.verifyPasswordResetOtp(email.trim(), codeToVerify),
        delay(),
      ]);
      setTicket(res.data.data.ticket);
      setStep("reset");
      showToast("Code verified. Please set your new password.", "success");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      showToast("Please enter the complete 6-digit code.", "error");
      return;
    }
    executeVerify(code);
  };

  // STEP 3: Reset Password
  const handleReset = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setToast({ message: "", type: "" });

    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters long.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }

    setSubmitting(true);
    try {
      await Promise.all([
        authApi.resetPassword(ticket, newPassword),
        delay(),
      ]);
      setStep("done");
      showToast("Password updated successfully!", "success");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center p-4 sm:p-6 font-body text-white antialiased relative overflow-hidden bg-cover bg-center bg-no-repeat bg-fixed ${bodyFont.className}`}
      style={{
        backgroundImage: `url('/adminpanel-backgound-loginpage.png')`,
        [bodyFont.variable]: "Manrope, sans-serif",
        [headingFont.variable]: "Manrope, sans-serif",
        [monoFont.variable]: "'JetBrains Mono', monospace",
      }}
    >
      <Seo title="Reset Password" description="Reset your administrator account password." />

      {/* Floating Snackbar Notification */}
      {toast.message && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl border flex items-center justify-between gap-3 ${
              toast.type === "error"
                ? "bg-slate-900/95 border-red-500/60 text-red-200"
                : toast.type === "success"
                ? "bg-slate-900/95 border-emerald-500/60 text-emerald-200"
                : "bg-slate-900/95 border-sky-500/60 text-sky-200"
            }`}
          >
            <p className="text-xs font-semibold truncate flex-1">{toast.message}</p>
            <button
              type="button"
              onClick={() => setToast({ message: "", type: "" })}
              className="text-xs opacity-70 hover:opacity-100 font-bold px-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <main className="w-full max-w-md z-10 my-auto relative">
        <div className="bg-slate-900/85 backdrop-blur-2xl rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-8 transition-all duration-300">
          
          {/* Form Header */}
          <div className="mb-8 text-center">
            <h1 className="text-xl font-heading font-bold text-white tracking-tight">
              {step === "request" && "Forgot Password"}
              {step === "verify" && "Enter Verification Code"}
              {step === "reset" && "Set New Password"}
              {step === "done" && "Password Reset Complete"}
            </h1>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-xs mx-auto">
              {step === "request" && "Enter your registered email address to receive a 6-digit code."}
              {step === "verify" && (
                <>
                  Enter the 6-digit code sent to{" "}
                  <span className="text-slate-200 font-semibold">{email}</span>
                </>
              )}
              {step === "reset" && "Create a new strong password for your account."}
              {step === "done" && "Your password has been reset successfully."}
            </p>
          </div>

          {/* STEP 1: Request OTP */}
          {step === "request" && (
            <form onSubmit={handleRequest} className="space-y-5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  disabled={submitting}
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@cameramobilezone.com"
                  className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl py-3 px-4 text-sm text-white placeholder:text-slate-500 focus:bg-slate-800/90 focus:outline-none focus:border-accent transition-all duration-200 disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !email.trim()}
                className="w-full bg-accent hover:bg-accentDark active:scale-[0.99] text-white font-semibold py-3 px-5 rounded-xl shadow-lg shadow-accent/20 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {submitting ? "Sending Code..." : "Send Verification Code"}
              </button>
            </form>
          )}

          {/* STEP 2: 6-Digit OTP Box + Timer */}
          {step === "verify" && (
            <form onSubmit={handleVerifySubmit} className="space-y-6">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-3 text-center">
                  6-Digit Verification Code
                </label>
                <div className="flex items-center justify-between gap-2" onPaste={handleOtpPaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpInputsRef.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      disabled={submitting}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-11 h-12 text-center text-lg font-bold font-mono text-white bg-slate-800/80 border border-slate-700 rounded-xl focus:border-accent focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all duration-200 disabled:opacity-50"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || otp.join("").length < 6}
                className="w-full bg-accent hover:bg-accentDark active:scale-[0.99] text-white font-semibold py-3 px-5 rounded-xl shadow-lg shadow-accent/20 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {submitting ? "Verifying..." : "Verify & Continue"}
              </button>

              {/* 30-Second Timer & Resend Option */}
              <div className="text-center pt-2 space-y-2">
                <div>
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleRequest}
                      disabled={submitting}
                      className="text-xs font-semibold text-accent hover:underline transition-all"
                    >
                      Resend Code
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">
                      Resend code in <strong className="text-white">{timer}s</strong>
                    </span>
                  )}
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setOtp(["", "", "", "", "", ""]);
                      setStep("request");
                    }}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    Change Email
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* STEP 3: Reset Password */}
          {step === "reset" && (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    disabled={submitting}
                    autoFocus
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl py-3 pl-4 pr-16 text-sm text-white placeholder:text-slate-500 focus:bg-slate-800/90 focus:outline-none focus:border-accent transition-all duration-200 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                  >
                    {showNewPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    disabled={submitting}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl py-3 pl-4 pr-16 text-sm text-white placeholder:text-slate-500 focus:bg-slate-800/90 focus:outline-none focus:border-accent transition-all duration-200 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !newPassword || !confirmPassword}
                className="w-full mt-2 bg-accent hover:bg-accentDark active:scale-[0.99] text-white font-semibold py-3 px-5 rounded-xl shadow-lg shadow-accent/20 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {submitting ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

          {/* STEP 4: Complete */}
          {step === "done" && (
            <div className="space-y-6 text-center">
              <p className="text-xs text-slate-300 leading-relaxed">
                Your password has been successfully updated. You can now log into your account using your new credentials.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-accent hover:bg-accentDark active:scale-[0.99] text-white font-semibold py-3 px-5 rounded-xl shadow-lg shadow-accent/20 transition-all duration-200 text-sm"
              >
                Proceed to Login
              </button>
            </div>
          )}

          {/* Footer Back Link */}
          <div className="text-center mt-6 pt-4 border-t border-slate-800/80">
            <Link
              to="/login"
              className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              ← Back to Login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}