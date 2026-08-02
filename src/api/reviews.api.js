import apiClient from "./axiosClient.js";

export const reviewsApi = {
  list: (params) => apiClient.get("/reviews", { params }),
  moderate: (id, isApproved) => apiClient.patch(`/reviews/${id}/moderate`, { isApproved }),
  remove: (id) => apiClient.delete(`/reviews/${id}`),
};
