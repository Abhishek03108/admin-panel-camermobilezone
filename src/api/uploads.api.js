import apiClient from "./axiosClient.js";

export const uploadsApi = {
  uploadImage: (file, folder = "misc") => {
    const form = new FormData();
    form.append("image", file);
    return apiClient.post(`/uploads/image?folder=${folder}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
