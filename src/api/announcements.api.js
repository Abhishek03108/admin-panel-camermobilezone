import apiClient from "./axiosClient.js";

export const announcementsApi = {
  list: () => apiClient.get("/announcements"),
  // payload: { subject?, intro? }
  sendTest: (productId, payload) => apiClient.post(`/announcements/${productId}/test`, payload),
  send: (productId, payload) => apiClient.post(`/announcements/${productId}/send`, payload),
  dismiss: (productId) => apiClient.delete(`/announcements/${productId}`),
};
