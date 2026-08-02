import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { authApi } from "../../api/auth.api.js";
import { getErrorMessage } from "../../api/axiosClient.js";
import Seo from "../../components/common/Seo.jsx";
import { bodyFont, headingFont, monoFont } from "../../font.js";

const delay = (ms = 1200) => new Promise((resolve) => setTimeout(resolve, ms));

export default function Login() {
  const { login, verifyTwoFactor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Universal Toast Snackbar State
  const [toast, setToast] = useState({ message: "", type: "" }); // 'error' | 'success' | 'info'

  // 2FA state
  const [ticket, setTicket] = useState(null);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  // 30-Second Timer State for 2FA Resend
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const otpInputsRef = useRef([]);

  // Show Toast Notification Helper
  const showToast = (message, type = "error") => {
    setToast({ message, type });
  };

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (toast.message) {
      const timerId = setTimeout(() => {
        setToast({ message: "", type: "" });
      }, 4000);
      return () => clearTimeout(timerId);
    }
  }, [toast]);

  // 30-Second Countdown Timer Logic for 2FA Step
  useEffect(() => {
    let interval = null;
    if (ticket && timer > 0) {
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
  }, [ticket, timer]);

  // Auto-focus first OTP field when entering 2FA step
  useEffect(() => {
    if (ticket && otpInputsRef.current[0]) {
      otpInputsRef.current[0].focus();
    }
  }, [ticket]);

  const goToDestination = () => {
    const redirectTo = location.state?.from || "/";
    navigate(redirectTo, { replace: true });
  };

  // STEP 1: Login Credentials Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setToast({ message: "", type: "" });
    setIsSubmitting(true);
    try {
      const [result] = await Promise.all([
        login(email.trim(), password),
        delay(),
      ]);

      if (result.requiresTwoFactor) {
        setTicket(result.ticket);
        setMaskedEmail(result.maskedEmail || "");
        setTimer(30);
        setCanResend(false);
        showToast("Verification code sent to your email.", "info");
      } else {
        goToDestination();
      }
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // OTP Box Change Handler
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Focus next input box
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Auto submit on all 6 digits completed
    const fullCode = newOtp.join("");
    if (fullCode.length === 6) {
      executeVerify2FA(fullCode);
    }
  };

  // OTP Backspace Handler
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // OTP Clipboard Paste Handler
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
      executeVerify2FA(newOtp.join(""));
    }
  };

  // STEP 2: Verify 2FA Core Logic
  const executeVerify2FA = async (codeToVerify) => {
    if (isSubmitting) return;
    setToast({ message: "", type: "" });
    setIsSubmitting(true);
    try {
      await Promise.all([
        verifyTwoFactor(ticket, codeToVerify),
        delay(),
      ]);
      goToDestination();
    } catch (err) {
      const retryTicket = err?.response?.data?.details?.[0]?.ticket;
      if (retryTicket) setTicket(retryTicket);
      showToast(getErrorMessage(err), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify2FASubmit = (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      showToast("Please enter the full 6-digit code.", "error");
      return;
    }
    executeVerify2FA(code);
  };

  // Resend 2FA Code Handler
  const handleResend = async () => {
    if (!canResend || isSubmitting) return;
    setToast({ message: "", type: "" });
    setIsSubmitting(true);
    try {
      await Promise.all([
        authApi.resendTwoFactorLoginOtp(ticket),
        delay(),
      ]);
      setTimer(30);
      setCanResend(false);
      showToast("A new verification code has been sent.", "success");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setIsSubmitting(false);
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
      <Seo title="Log in" description="Log in to the Camera Mobile Zone admin panel." />

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

      {/* Main Card Container */}
      <main className="w-full max-w-md z-10 my-auto relative">
        <div className="bg-slate-900/85 backdrop-blur-2xl rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-8 transition-all duration-300">
          {!ticket ? (
            <>
              {/* Login Form Header */}
              <div className="mb-8 text-center">
                <h1 className="text-xl font-heading font-bold text-white tracking-tight">
                  Welcome Back
                </h1>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Enter your credentials to access the admin portal.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    disabled={isSubmitting}
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@cameramobilezone.com"
                    className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl py-3 px-4 text-sm text-white placeholder:text-slate-500 focus:bg-slate-800/90 focus:outline-none focus:border-accent transition-all duration-200 disabled:opacity-50"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs font-semibold text-accent hover:underline transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      disabled={isSubmitting}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl py-3 pl-4 pr-16 text-sm text-white placeholder:text-slate-500 focus:bg-slate-800/90 focus:outline-none focus:border-accent transition-all duration-200 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !email.trim() || !password}
                  className="w-full bg-accent hover:bg-accentDark active:scale-[0.99] text-white font-semibold py-3 px-5 rounded-xl shadow-lg shadow-accent/20 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? "Authenticating..." : "Sign in to Dashboard"}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* 2FA Form Header */}
              <div className="mb-8 text-center">
                <h1 className="text-xl font-heading font-bold text-white tracking-tight">
                  Two-Factor Authentication
                </h1>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Enter the 6-digit code sent to{" "}
                  <span className="font-semibold text-slate-200">{maskedEmail}</span>
                </p>
              </div>

              <form onSubmit={handleVerify2FASubmit} className="space-y-6">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-3 text-center">
                    6-Digit Security Code
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
                        disabled={isSubmitting}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-11 h-12 text-center text-lg font-bold font-mono text-white bg-slate-800/80 border border-slate-700 rounded-xl focus:border-accent focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all duration-200 disabled:opacity-50"
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || otp.join("").length < 6}
                  className="w-full bg-accent hover:bg-accentDark active:scale-[0.99] text-white font-semibold py-3 px-5 rounded-xl shadow-lg shadow-accent/20 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? "Verifying..." : "Verify Identity"}
                </button>

                {/* Resend Timer & Options */}
                <div className="text-center pt-2 space-y-2">
                  <div>
                    {canResend ? (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={isSubmitting}
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
                      disabled={isSubmitting}
                      onClick={() => {
                        setTicket(null);
                        setOtp(["", "", "", "", "", ""]);
                      }}
                      className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      ← Back to Login
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}

          {/* Footer Navigation */}
          {!ticket && (
            <div className="text-center mt-6 pt-4 border-t border-slate-800/80">
              <span className="text-xs text-slate-500">
                Camera Mobile Zone Management Panel
              </span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}