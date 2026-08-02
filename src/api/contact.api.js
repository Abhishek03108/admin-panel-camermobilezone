import apiClient from "./axiosClient.js";

export const contactApi = {
  list: (params) => apiClient.get("/contact-messages", { params }),
  resolve: (id, isResolved = true) => apiClient.patch(`/contact-messages/${id}/resolve`, { isResolved }),
};
