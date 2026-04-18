import api from "../api";

export const fetchPostCollections = async () => {
    const response = await api.get("/saved-posts/collections", { withCredentials: true });
    return Array.isArray(response.data) ? response.data : [];
};

export const createPostCollection = async (name) => {
    const response = await api.post(
        "/saved-posts/collections",
        { name },
        { withCredentials: true }
    );
    return response.data;
};

export const savePostToCollection = async (postId, payload = {}) => {
    const response = await api.post(`/saved-posts/${postId}`, payload, { withCredentials: true });
    return response.data;
};

export const unsavePost = async (postId) => {
    await api.delete(`/saved-posts/${postId}`, { withCredentials: true });
};

export const fetchSavedPosts = async ({ collectionId = null, limit = 50 } = {}) => {
    const response = await api.get("/saved-posts", {
        withCredentials: true,
        params: {
            limit,
            ...(collectionId ? { collectionId } : {}),
        },
    });
    return Array.isArray(response.data) ? response.data : [];
};

export const fetchSavedPostIds = async () => {
    const response = await api.get("/saved-posts/ids", { withCredentials: true });
    const ids = response?.data?.savedPostIds;
    return Array.isArray(ids) ? ids : [];
};
