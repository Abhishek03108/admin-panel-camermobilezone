import apiClient from "./axiosClient.js";

export const paymentsApi = {
  list: (params) => apiClient.get("/payments", { params }),
  get: (id) => apiClient.get(`/payments/${id}`),
  verify: (id, action, rejectionReason) =>
    apiClient.patch(`/payments/${id}/verify`, { action, rejectionReason }),
};
