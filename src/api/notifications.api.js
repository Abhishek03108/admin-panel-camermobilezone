import apiClient from "./axiosClient.js";

export const notificationsApi = {
  list: (params) => apiClient.get("/notifications", { params }),
  send: (payload) => apiClient.post("/notifications", payload),
  remove: (id) => apiClient.delete(`/notifications/${id}`),
};
