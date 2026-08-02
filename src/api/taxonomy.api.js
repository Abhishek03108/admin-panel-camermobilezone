import apiClient from "./axiosClient.js";

export const categoriesApi = {
  list: () => apiClient.get("/categories"),
  seedDefaults: () => apiClient.post("/categories/seed-defaults"),
  update: (id, payload) => apiClient.patch(`/categories/${id}`, payload),
};

export const subCategoriesApi = {
  create: (payload) => apiClient.post("/sub-categories", payload),
  update: (id, payload) => apiClient.patch(`/sub-categories/${id}`, payload),
  remove: (id) => apiClient.delete(`/sub-categories/${id}`),
};

export const brandsApi = {
  list: () => apiClient.get("/brands"),
  create: (payload) => apiClient.post("/brands", payload),
  update: (id, payload) => apiClient.patch(`/brands/${id}`, payload),
  remove: (id) => apiClient.delete(`/brands/${id}`),
};
