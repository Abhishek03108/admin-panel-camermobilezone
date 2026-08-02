import apiClient from "./axiosClient.js";

function makeListApi(basePath) {
  return {
    list: () => apiClient.get(basePath),
    add: (productId) => apiClient.post(basePath, { productId }),
    remove: (productId) => apiClient.delete(`${basePath}/${productId}`),
    reorder: (order) => apiClient.patch(`${basePath}/reorder`, { order }),
  };
}

export const trendingApi = makeListApi("/trending");
export const recentlyAddedApi = makeListApi("/recently-added");

export const dealsOfWeekApi = {
  ...makeListApi("/deals-of-week"),
  getSettings: () => apiClient.get("/deals-of-week/settings"),
  updateSettings: (payload) => apiClient.put("/deals-of-week/settings", payload),
};
