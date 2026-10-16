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

/** Mobile-app home banners — separate from the website's hero banners. */
export const appBannersApi = {
  list: () => apiClient.get("/content/app-banners"),
  create: (file, link) => {
    const form = new FormData();
    form.append("image", file);
    if (link) form.append("link", link);
    return apiClient.post("/content/app-banners", form, { headers: { "Content-Type": "multipart/form-data" } });
  },
  update: (id, { file, link, isActive }) => {
    const form = new FormData();
    if (file) form.append("image", file);
    if (link !== undefined) form.append("link", link);
    if (isActive !== undefined) form.append("isActive", String(isActive));
    return apiClient.patch(`/content/app-banners/${id}`, form, { headers: { "Content-Type": "multipart/form-data" } });
  },
  reorder: (ids) => apiClient.patch("/content/app-banners/reorder", { ids }),
  remove: (id) => apiClient.delete(`/content/app-banners/${id}`),
};
