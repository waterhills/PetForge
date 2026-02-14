// Community Module TypeScript Types

export interface PetIP {
  id: string;
  userId: string;
  name: string;
  style: string;
  rarity: string;
  originalImage?: string;
  generatedImage: string;
  model3D?: string;
  likes: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityPost {
  id: string;
  userId: string;
  petIpId?: string;
  content: string;
  images?: string[];
  likes: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  petIp?: {
    id: string;
    name: string;
    generatedImage: string;
  };
  isLiked?: boolean;
  isFavorited?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  parentId?: string;
  content: string;
  likes: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  replies?: Comment[];
}

export interface Notification {
  id: string;
  userId: string;
  postId?: string;
  commentId?: string;
  type: 'like' | 'comment' | 'reply' | 'favorite';
  isRead: boolean;
  createdAt: string;
  post?: CommunityPost;
  comment?: Comment;
}

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string | any[];
  pagination?: PaginationData;
}

// Request DTOs
export interface CreatePostDTO {
  petIpId?: string;
  content: string;
  isPublic?: boolean;
}

export interface UpdatePostDTO {
  content?: string;
  isPublic?: boolean;
}

export interface CreateCommentDTO {
  content: string;
  parentId?: string;
}

export interface UpdateCommentDTO {
  content: string;
}
