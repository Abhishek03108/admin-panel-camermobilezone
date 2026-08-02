import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { ArrowLeft, ShieldAlert, CheckCircle2, Camera, KeyRound } from "lucide-react";
import { authApi } from "../../api/auth.api.js";
import { getErrorMessage } from "../../api/axiosClient.js";

const SCANNER_ELEMENT_ID = "qr-scanner-viewport";
const PAIR_PREFIX = "CMZADMIN-DEVICEPAIR:";
const LOGIN_PREFIX = "CMZADMIN-QRLOGIN:";
const DEVICE_TOKEN_KEY = "cmz_admin_device_token";

export default function Scan() {
  const [deviceToken, setDeviceToken] = useState(null);
  // idle | scanning | processing | paired | approved | error
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const scannerRef = useRef(null);

  useEffect(() => {
    setDeviceToken(localStorage.getItem(DEVICE_TOKEN_KEY));
  }, []);

  useEffect(() => {
    if (status !== "scanning") return;

    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
    scannerRef.current = scanner;
    let stopped = false;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decodedText) => {
          if (stopped) return;

          // A setup QR (from Settings → Trusted Devices) — save the
          // passkey right here, no network call needed, the token is
          // already valid the moment it was generated.
          if (decodedText.startsWith(PAIR_PREFIX)) {
            stopped = true;
            const token = decodedText.slice(PAIR_PREFIX.length);
            try {
              await scanner.stop();
            } catch {
              // already stopped/stopping
            }
            localStorage.setItem(DEVICE_TOKEN_KEY, token);
            setDeviceToken(token);
            setStatus("paired");
            setMessage("This device is now paired. You can use it to scan login QR codes anytime.");
            return;
          }

          // A login QR (from another browser's "Log in with your phone"
          // screen) — approve it immediately using our saved passkey, no
          // extra confirmation step.
          if (decodedText.startsWith(LOGIN_PREFIX)) {
            if (!deviceToken) {
              stopped = true;
              try {
                await scanner.stop();
              } catch {
                //
              }
              setStatus("error");
              setMessage("This device doesn't have a saved passkey yet. Scan a setup QR from Settings first.");
              return;
            }

            stopped = true;
            const sessionId = decodedText.slice(LOGIN_PREFIX.length);
            try {
              await scanner.stop();
            } catch {
              //
            }
            setStatus("processing");
            try {
              await authApi.approveQrLogin(sessionId, deviceToken);
              setStatus("approved");
              setMessage("Login approved. The other device will now be signed in automatically.");
            } catch (err) {
              setStatus("error");
              setMessage(getErrorMessage(err));
            }
          }
        },
        () => {
          // Per-frame "no QR found" callback — expected constantly while
          // aiming the camera, intentionally not surfaced as an error.
        }
      )
      .catch(() => {
        setStatus("error");
        setMessage("We couldn't access your camera. Please allow camera permission and try again.");
      });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div className="min-h-screen bg-panel flex items-center justify-center p-4">
      <div className="w-full max-w-md card p-7 text-center">
        <h2 className="text-base font-semibold text-ink mb-1">Scan a QR code</h2>
        <p className="text-sm text-muted mb-5">
          {deviceToken
            ? "This device is paired. Scan a setup QR to re-pair, or a login QR to sign in another device."
            : "Scan the setup QR from Settings → Trusted Devices to save a passkey on this device."}
        </p>

        {status === "idle" && (
          <button className="btn-primary w-full" onClick={() => setStatus("scanning")}>
            <Camera size={16} /> Start Scanning
          </button>
        )}

        {(status === "scanning" || status === "processing") && (
          <div>
            <div id={SCANNER_ELEMENT_ID} className="mx-auto rounded-xl overflow-hidden" />
            {status === "processing" && <p className="text-sm text-muted mt-3">Approving login…</p>}
          </div>
        )}

        {status === "paired" && (
          <div className="flex flex-col items-center gap-2 py-4">
            <KeyRound size={28} className="text-verify" />
            <p className="text-sm text-ink font-medium">{message}</p>
            <button className="btn-secondary mt-2" onClick={() => setStatus("idle")}>
              Done
            </button>
          </div>
        )}

        {status === "approved" && (
          <div className="flex flex-col items-center gap-2 py-4">
            <CheckCircle2 size={28} className="text-verify" />
            <p className="text-sm text-ink font-medium">{message}</p>
            <button className="btn-secondary mt-2" onClick={() => setStatus("idle")}>
              Scan another
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-2 py-4">
            <ShieldAlert size={28} className="text-danger" />
            <p className="text-sm text-danger">{message}</p>
            <button className="btn-primary mt-2" onClick={() => setStatus("idle")}>
              Try again
            </button>
          </div>
        )}

        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mt-6">
          <ArrowLeft size={14} /> Back to login
        </Link>
      </div>
    </div>
  );
}