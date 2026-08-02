import apiClient from "./axiosClient.js";

export const usersApi = {
  list: (params) => apiClient.get("/users", { params }),
  get: (id) => apiClient.get(`/users/${id}`),
  setActiveStatus: (id, isActive) => apiClient.patch(`/users/${id}/status`, { isActive }),
};
