import apiClient from "./axiosClient.js";

export const appControlApi = {
  get: () => apiClient.get("/app-control"),
  // payload: { reason, message?, startsAt?, endsAt?, autoEnable, notifyInApp, notifyEmail }
  disable: (payload) => apiClient.post("/app-control/disable", payload),
  // payload: { notifyInApp, notifyEmail }
  enable: (payload) => apiClient.post("/app-control/enable", payload),
};
