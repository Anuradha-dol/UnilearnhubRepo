import api from "../api";

export const fetchCommentCount = async (postId) => {
  const response = await api.get(`/comments/${postId}/count`);
  return Number(response.data || 0);
};

export const fetchCommentPreview = async (postId, limit = 2) => {
  const response = await api.get(`/comments/${postId}/all`, {
    params: { limit },
  });
  return response.data || [];
};

export const fetchAllComments = async (postId) => {
  const response = await api.get(`/comments/${postId}/all`);
  return response.data || [];
};

export const createComment = async (postId, content, attachment) => {
  const formData = new FormData();
  formData.append("content", content || "");

  if (attachment) {
    formData.append("attachment", attachment);
  }

  const response = await api.post(`/comments/${postId}/add`, formData, {
    withCredentials: true,
  });

  return response.data;
};

export const replyToComment = async (postId, parentCommentId, content, attachment) => {
  const formData = new FormData();
  formData.append("content", content || "");

  if (attachment) {
    formData.append("attachment", attachment);
  }

  const response = await api.post(`/comments/${postId}/reply/${parentCommentId}`, formData, {
    withCredentials: true,
  });

  return response.data;
};

export const updateCommentById = async (commentId, content) => {
  const response = await api.put(
      `/comments/${commentId}/update`,
      { content },
      { withCredentials: true }
  );

  return response.data;
};

export const deleteCommentById = async (commentId) => {
  const response = await api.delete(`/comments/${commentId}/delete`, {
    withCredentials: true,
  });

  return response.data;
};
