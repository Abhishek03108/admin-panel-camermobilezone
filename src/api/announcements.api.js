import apiClient from "./axiosClient.js";

export const announcementsApi = {
  list: () => apiClient.get("/announcements"),
  // payload: { subject?, intro? }
  sendTest: (productId, payload) => apiClient.post(`/announcements/${productId}/test`, payload),
  send: (productId, payload) => apiClient.post(`/announcements/${productId}/send`, payload),
  // payload: { title?, body? } — in-app inbox + phone push
  sendInApp: (productId, payload) => apiClient.post(`/announcements/${productId}/app`, payload),
  dismiss: (productId) => apiClient.delete(`/announcements/${productId}`),
};
