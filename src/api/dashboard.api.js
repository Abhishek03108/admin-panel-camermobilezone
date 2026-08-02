import apiClient from "./axiosClient.js";

export const dashboardApi = {
  summary: () => apiClient.get("/dashboard/summary"),
};
