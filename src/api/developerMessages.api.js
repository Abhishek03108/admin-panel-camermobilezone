import apiClient from "./axiosClient.js";

export const developerMessagesApi = {
  list: (params) => apiClient.get("/developer-messages", { params }),
  resolve: (id, isResolved = true) => apiClient.patch(`/developer-messages/${id}/resolve`, { isResolved }),
  remove: (id) => apiClient.delete(`/developer-messages/${id}`),
};
