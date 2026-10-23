import apiClient from "./axiosClient.js";

export const paymentsApi = {
  list: (params) => apiClient.get("/payments", { params }),
  get: (id) => apiClient.get(`/payments/${id}`),
  // Rejecting cancels the order and restocks it. deactivateAccount (default
  // true) also deactivates the customer — for fake / unrelated screenshots.
  verify: (id, action, rejectionReason, deactivateAccount) =>
    apiClient.patch(`/payments/${id}/verify`, {
      action,
      rejectionReason,
      ...(action === "Rejected" ? { deactivateAccount: deactivateAccount !== false } : {}),
    }),
};
