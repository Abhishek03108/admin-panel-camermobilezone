import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { authApi } from "../../api/auth.api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import Seo from "../../components/common/Seo.jsx";

const POLL_INTERVAL_MS = 2500;

export default function QrLogin() {
  const { setAdminSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | pending | expired | error
  const pollRef = useRef(null);

  const goToDestination = () => {
    const redirectTo = location.state?.from || "/";
    navigate(redirectTo, { replace: true });
  };

  const startSession = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await authApi.startQrLogin();
      setSessionId(res.data.data.sessionId);
      setQrCodeDataUrl(res.data.data.qrCodeDataUrl);
      setStatus("pending");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    startSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!sessionId || status !== "pending") return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await authApi.pollQrLogin(sessionId);
        const data = res.data.data;
        if (data.status === "approved") {
          clearInterval(pollRef.current);
          setAdminSession(data.admin);
          goToDestination();
        } else if (data.status === "expired") {
          clearInterval(pollRef.current);
          setStatus("expired");
        }
      } catch {
        // Transient network error — keep polling silently.
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, status]);

  return (
    <div className="min-h-screen bg-panel flex items-center justify-center p-4">
      <Seo title="Log in with your phone" description="Scan a QR code to log in." />
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-white font-bold text-lg mb-3">
            C
          </div>
          <h1 className="text-lg font-semibold text-ink">Camera Mobile Zone</h1>
          <p className="text-sm text-muted mt-0.5">Admin Panel</p>
        </div>

        <div className="card p-7 text-center">
          <h2 className="text-base font-semibold text-ink mb-1">Log in with your phone</h2>
          <p className="text-sm text-muted mb-6">
           Open a device you've already paired, go to{" "}
<span className="font-medium text-ink">/scan</span>, and point its camera at this code.
          </p>

          <div className="flex items-center justify-center min-h-[240px]">
            {status === "loading" && <p className="text-sm text-muted">Generating QR code…</p>}

            {status === "pending" && qrCodeDataUrl && (
              <div className="flex flex-col items-center gap-3">
                <img src={qrCodeDataUrl} alt="Scan to log in" className="w-56 h-56 rounded-xl border border-line" />
                <p className="text-xs text-muted">Waiting for you to scan…</p>
              </div>
            )}

            {status === "expired" && (
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm text-danger">This QR code expired.</p>
                <button className="btn-primary" onClick={startSession}>
                  <RefreshCw size={15} /> Generate a new code
                </button>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm text-danger">Couldn't start a QR login session. Please try again.</p>
                <button className="btn-primary" onClick={startSession}>
                  <RefreshCw size={15} /> Try again
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
            <ArrowLeft size={14} /> Back to password login
          </Link>
        </div>
      </div>
    </div>
  );
}