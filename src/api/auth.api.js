import apiClient from "./axiosClient.js";

export const authApi = {
  login: (email, password) => apiClient.post("/auth/login", { email, password }),
  logout: () => apiClient.post("/auth/logout"),
  me: () => apiClient.get("/auth/me"),
  changePassword: (currentPassword, newPassword) =>
    apiClient.post("/auth/change-password", { currentPassword, newPassword }),
  requestPasswordResetOtp: (email) => apiClient.post("/auth/forgot-password/request-otp", { email }),
  verifyPasswordResetOtp: (email, code) => apiClient.post("/auth/forgot-password/verify-otp", { email, code }),
  resetPassword: (ticket, newPassword) => apiClient.post("/auth/forgot-password/reset", { ticket, newPassword }),

  // 2FA — email OTP (sent automatically on login/setup, no authenticator app)
  verifyTwoFactorLogin: (ticket, code) => apiClient.post("/auth/2fa/verify-login", { ticket, code }),
  resendTwoFactorLoginOtp: (ticket) => apiClient.post("/auth/2fa/resend-login-otp", { ticket }),
  getTwoFactorStatus: () => apiClient.get("/auth/2fa/status"),
  setupTwoFactor: () => apiClient.post("/auth/2fa/setup"),
  enableTwoFactor: (code) => apiClient.post("/auth/2fa/enable", { code }),
  disableTwoFactor: (password) => apiClient.post("/auth/2fa/disable", { password }),

  // Trusted devices ("passkeys") — QR-based setup, like an authenticator app.
  setupDeviceQr: (deviceLabel) => apiClient.post("/auth/devices/setup-qr", { deviceLabel }),
  listDevices: () => apiClient.get("/auth/devices"),
  removeDevice: (id) => apiClient.delete(`/auth/devices/${id}`),

  // QR login — called by the WAITING (unauthenticated) browser.
  startQrLogin: () => apiClient.post("/auth/qr-login/start"),
  pollQrLogin: (sessionId) => apiClient.get(`/auth/qr-login/poll/${sessionId}`),
  // Called by the TRUSTED device after scanning the QR — needs no admin
  // session, the stored device token is the credential.
  approveQrLogin: (sessionId, deviceToken) =>
    apiClient.post("/auth/qr-login/approve", { sessionId, deviceToken }),
};