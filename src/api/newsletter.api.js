import apiClient from "./axiosClient.js";

export const newsletterApi = {
  list: (params) => apiClient.get("/newsletter-subscribers", { params }),
};
