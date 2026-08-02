import apiClient from "./axiosClient.js";

export const testimonialsApi = {
  list: () => apiClient.get("/content/testimonials"),
  create: (payload) => apiClient.post("/content/testimonials", payload),
  update: (id, payload) => apiClient.patch(`/content/testimonials/${id}`, payload),
  remove: (id) => apiClient.delete(`/content/testimonials/${id}`),
};

export const faqsApi = {
  list: () => apiClient.get("/content/faqs"),
  create: (payload) => apiClient.post("/content/faqs", payload),
  update: (id, payload) => apiClient.patch(`/content/faqs/${id}`, payload),
  remove: (id) => apiClient.delete(`/content/faqs/${id}`),
};

export const heroBannersApi = {
  list: () => apiClient.get("/content/hero-banners"),
  create: (file, isActive = true) => {
    const form = new FormData();
    form.append("image", file);
    form.append("isActive", String(isActive));
    return apiClient.post("/content/hero-banners", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  update: (id, { file, isActive }) => {
    const form = new FormData();
    if (file) form.append("image", file);
    if (isActive !== undefined) form.append("isActive", String(isActive));
    return apiClient.patch(`/content/hero-banners/${id}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  remove: (id) => apiClient.delete(`/content/hero-banners/${id}`),
};
