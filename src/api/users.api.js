import apiClient from "./axiosClient.js";

export const usersApi = {
  list: (params) => apiClient.get("/users", { params }),
  get: (id) => apiClient.get(`/users/${id}`),
  setActiveStatus: (id, isActive, note) => apiClient.patch(`/users/${id}/status`, { isActive, ...(note ? { note } : {}) }),
  // Deactivated accounts (fake payment, admin, self) with their latest reactivation request.
  listDeactivated: (params) => apiClient.get("/users/deactivated", { params }),
  handleReactivationRequest: (id, action, adminNote) =>
    apiClient.patch(`/users/reactivation-requests/${id}`, { action, ...(adminNote ? { adminNote } : {}) }),
  // Welcome email — each customer can be welcomed only once (enforced by the API).
  welcomeSummary: () => apiClient.get("/users/welcome/summary"),
  sendWelcome: (id) => apiClient.post(`/users/${id}/welcome`),
  sendPendingWelcomes: () => apiClient.post("/users/welcome/pending"),
};

export const accountDeletionsApi = {
  list: (params) => apiClient.get("/users/deletions", { params }),
};
