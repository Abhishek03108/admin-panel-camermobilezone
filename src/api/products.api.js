import apiClient from "./axiosClient.js";

export const productsApi = {
  list: (params) => apiClient.get("/products", { params }),
  get: (id) => apiClient.get(`/products/${id}`),
  create: (payload) => apiClient.post("/products", payload),
  update: (id, payload) => apiClient.patch(`/products/${id}`, payload),
  remove: (id) => apiClient.delete(`/products/${id}`),

  addImages: (id, files) => {
    const form = new FormData();
    Array.from(files).forEach((f) => form.append("images", f));
    return apiClient.post(`/products/${id}/images`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteImage: (id, imageId) => apiClient.delete(`/products/${id}/images/${imageId}`),
  reorderImages: (id, order) => apiClient.patch(`/products/${id}/images/reorder`, { order }),

  replaceSpecs: (id, specs) => apiClient.put(`/products/${id}/specs`, { specs }),
  replaceInspectionPoints: (id, inspectionPoints) =>
    apiClient.put(`/products/${id}/inspection-points`, { inspectionPoints }),
};
