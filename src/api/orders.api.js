import apiClient from "./axiosClient.js";

export const ordersApi = {
  list: (params) => apiClient.get("/orders", { params }),
  get: (id) => apiClient.get(`/orders/${id}`),
  updateStatus: (id, status, note) => apiClient.patch(`/orders/${id}/status`, { status, note }),
};
