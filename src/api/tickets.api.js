import apiClient from "./axiosClient.js";

export const ticketsApi = {
  list: (params) => apiClient.get("/tickets", { params }),
  get: (id) => apiClient.get(`/tickets/${id}`),
  reply: (id, message, status) => apiClient.post(`/tickets/${id}/messages`, { message, status: status || undefined }),
  setStatus: (id, status) => apiClient.patch(`/tickets/${id}/status`, { status }),
};
