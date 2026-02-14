// Community API Client Utilities
import api from './api';
import type {
  ApiResponse,
  CommunityPost,
  Comment,
  Notification,
  CreatePostDTO,
  UpdatePostDTO,
  CreateCommentDTO,
  PaginationData,
} from '../types/community';

const COMMUNITY_BASE = '/api/community';

// Post endpoints
export async function fetchPosts(
  params?: {
    page?: number;
    limit?: number;
    userId?: string;
  }
): Promise<ApiResponse<CommunityPost[]>> {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.append(key, String(value));
    });
  }
  return api.request(`${COMMUNITY_BASE}/posts?${searchParams.toString()}`, {}, false);
}

export async function fetchPost(id: string): Promise<ApiResponse<CommunityPost>> {
  return api.request(`${COMMUNITY_BASE}/posts/${id}`, {}, false);
}

export async function createPost(
  data: CreatePostDTO
): Promise<ApiResponse<CommunityPost>> {
  return api.request(`${COMMUNITY_BASE}/posts`, {
    method: 'POST',
    body: JSON.stringify(data),
  }, true);
}

export async function updatePost(
  id: string,
  data: UpdatePostDTO
): Promise<ApiResponse<CommunityPost>> {
  return api.request(`${COMMUNITY_BASE}/posts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }, true);
}

export async function deletePost(id: string): Promise<ApiResponse<{ message: string }>> {
  return api.request(`${COMMUNITY_BASE}/posts/${id}`, {
    method: 'DELETE',
  }, true);
}

// Like endpoints
export async function toggleLike(
  postId: string
): Promise<ApiResponse<{ liked: boolean; likes: number }>> {
  return api.request(`${COMMUNITY_BASE}/posts/${postId}/like`, {
    method: 'POST',
  }, true);
}

// Favorite endpoints
export async function toggleFavorite(
  postId: string
): Promise<ApiResponse<{ favorited: boolean }>> {
  return api.request(`${COMMUNITY_BASE}/posts/${postId}/favorite`, {
    method: 'POST',
  }, true);
}

// Comment endpoints
export async function fetchComments(
  postId: string
): Promise<ApiResponse<Comment[]>> {
  return api.request(`${COMMUNITY_BASE}/posts/${postId}/comments`, {}, false);
}

export async function createComment(
  postId: string,
  data: CreateCommentDTO
): Promise<ApiResponse<Comment>> {
  return api.request(`${COMMUNITY_BASE}/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify(data),
  }, true);
}

export async function updateComment(
  commentId: string,
  content: string
): Promise<ApiResponse<Comment>> {
  return api.request(`${COMMUNITY_BASE}/comments/${commentId}`, {
    method: 'PATCH',
    body: JSON.stringify({ content }),
  }, true);
}

export async function deleteComment(
  commentId: string
): Promise<ApiResponse<{ message: string }>> {
  return api.request(`${COMMUNITY_BASE}/comments/${commentId}`, {
    method: 'DELETE',
  }, true);
}

// Notification endpoints
export async function fetchNotifications(
  params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }
): Promise<ApiResponse<Notification[]>> {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.append(key, String(value));
    });
  }
  return api.request(`${COMMUNITY_BASE}/notifications?${searchParams.toString()}`, {}, true);
}

export async function markNotificationRead(
  notificationId: string
): Promise<ApiResponse<{ message: string }>> {
  return api.request(`${COMMUNITY_BASE}/notifications/${notificationId}/read`, {
    method: 'PATCH',
  }, true);
}

export async function markAllNotificationsRead(): Promise<
  ApiResponse<{ message: string }>
> {
  return api.request(`${COMMUNITY_BASE}/notifications/read-all`, {
    method: 'PATCH',
  }, true);
}

// Unread notification count helper
export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const response = await fetchNotifications({ page: 1, limit: 1, unreadOnly: true });
    return response.pagination?.total || 0;
  } catch (error) {
    console.error('Failed to fetch unread count:', error);
    return 0;
  }
}
