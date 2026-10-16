import apiClient from "./axiosClient.js";

export const emailsApi = {
  history: (params) => apiClient.get("/emails", { params }),
  get: (id) => apiClient.get(`/emails/${id}`),
  audience: () => apiClient.get("/emails/audience"),
  // recipients: { audience, respectOptOut, userIds, extraEmails }
  countRecipients: (recipients) => apiClient.post("/emails/recipient-count", recipients),
  sendTest: (payload) => apiClient.post("/emails/test", payload),
  send: (payload) => apiClient.post("/emails/send", payload),
};
