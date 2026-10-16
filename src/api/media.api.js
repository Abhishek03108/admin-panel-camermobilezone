import apiClient from "./axiosClient.js";

export const mediaApi = {
  // params: { status: "active" | "trash", folder, usage: "used" | "unused", page, limit }
  list: (params) => apiClient.get("/media", { params }),
  summary: () => apiClient.get("/media/summary"),
  trash: (ids) => apiClient.post("/media/trash", { ids }),
  restore: (ids) => apiClient.post("/media/restore", { ids }),
  deletePermanently: (ids) => apiClient.post("/media/delete-permanently", { ids }),
};
