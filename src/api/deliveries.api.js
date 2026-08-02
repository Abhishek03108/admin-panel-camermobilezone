import apiClient from "./axiosClient.js";

export const deliveriesApi = {
  list: (params) => apiClient.get("/deliveries", { params }),
  update: (orderId, payload) => apiClient.patch(`/deliveries/${orderId}`, payload),
};
