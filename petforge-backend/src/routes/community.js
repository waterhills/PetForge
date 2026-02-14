import express from 'express';
import { z } from 'zod';
import prisma from '../config/database.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Validation schemas
const createPostSchema = z.object({
  petIpId: z.string().cuid().optional(),
  content: z.string().min(1, 'Content is required').max(2000, 'Content too long (max 2000 characters)'),
  isPublic: z.boolean().optional(),
});

const updatePostSchema = z.object({
  content: z.string().min(1).max(2000).optional(),
  isPublic: z.boolean().optional(),
});

const createCommentSchema = z.object({
  content: z.string().min(1, 'Content is required').max(1000, 'Content too long (max 1000 characters)'),
  parentId: z.string().cuid().optional(),
});

const updateCommentSchema = z.object({
  content: z.string().min(1).max(1000),
});

// Helper function to build threaded comment structure
function buildThreadedComments(comments) {
  const commentMap = new Map();
  const rootComments = [];

  // First pass: create map and identify roots
  comments.forEach((comment) => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  // Second pass: build tree
  comments.forEach((comment) => {
    const commentWithReplies = commentMap.get(comment.id);
    if (comment.parentId) {
      const parent = commentMap.get(comment.parentId);
      if (parent) {
        parent.replies.push(commentWithReplies);
      } else {
        rootComments.push(commentWithReplies);
      }
    } else {
      rootComments.push(commentWithReplies);
    }
  });

  return rootComments;
}

// Helper function to create notification (if not notifying self)
async function createNotification(userId, postId, commentId, type, prisma) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        postId,
        commentId,
        type,
      },
    });
  } catch (error) {
    console.error('[Community] Failed to create notification:', error);
  }
}

// GET /api/community/posts - List posts (paginated)
router.get('/posts', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, userId } = req.query;
    const currentUserId = req.userId;

    const where = {
      deletedAt: null,
    };

    // Filter by userId if specified
    if (userId) {
      if (userId === 'current') {
        if (!currentUserId) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required to access your posts',
          });
        }
        where.userId = currentUserId;
      } else {
        where.userId = userId;
      }
    } else {
      // If not filtering by specific user, only show public posts or own posts
      where.OR = [
        { isPublic: true },
        ...(currentUserId ? [{ userId: currentUserId }] : []),
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          petIp: {
            select: {
              id: true,
              name: true,
              generatedImage: true,
            },
          },
          ...(currentUserId && {
            likesList: {
              where: { userId: currentUserId },
              select: { id: true },
            },
            favorites: {
              where: { userId: currentUserId },
              select: { id: true },
            },
          }),
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.communityPost.count({ where }),
    ]);

    // Add isLiked and isFavorited flags
    const postsWithFlags = posts.map((post) => ({
      ...post,
      isLiked: post.likesList?.length > 0,
      isFavorited: post.favorites?.length > 0,
      likesList: undefined,
      favorites: undefined,
    }));

    res.json({
      success: true,
      data: postsWithFlags,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('[Community] Get posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get posts',
    });
  }
});

// GET /api/community/posts/:id - Get single post
router.get('/posts/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.userId;

    const post = await prisma.communityPost.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        petIp: {
          select: {
            id: true,
            name: true,
            generatedImage: true,
          },
        },
        ...(currentUserId && {
          likesList: {
            where: { userId: currentUserId },
            select: { id: true },
          },
          favorites: {
            where: { userId: currentUserId },
            select: { id: true },
          },
        }),
      },
    });

    if (!post || post.deletedAt) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Privacy check
    if (!post.isPublic && post.userId !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this post',
      });
    }

    const postWithFlags = {
      ...post,
      isLiked: post.likesList?.length > 0,
      isFavorited: post.favorites?.length > 0,
      likesList: undefined,
      favorites: undefined,
    };

    res.json({
      success: true,
      data: postWithFlags,
    });
  } catch (error) {
    console.error('[Community] Get post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get post',
    });
  }
});

// POST /api/community/posts - Create post
router.post('/posts', authenticateToken, async (req, res) => {
  const userId = req.userId;
  try {
    console.log('[Community] Create post request body:', JSON.stringify(req.body));

    const validatedData = createPostSchema.parse(req.body);

    // If petIpId is provided, verify ownership
    if (validatedData.petIpId) {
      const petIP = await prisma.petIP.findUnique({
        where: { id: validatedData.petIpId },
      });

      if (!petIP) {
        return res.status(404).json({
          success: false,
          error: 'PetIP not found',
        });
      }

      if (petIP.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'You can only post your own PetIPs',
        });
      }
    }

    const post = await prisma.communityPost.create({
      data: {
        userId,
        ...validatedData,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        petIp: {
          select: {
            id: true,
            name: true,
            generatedImage: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: post,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: error.errors,
      });
    }
    console.error('[Community] Create post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create post',
    });
  }
});

// PATCH /api/community/posts/:id - Update post
router.patch('/posts/:id', authenticateToken, async (req, res) => {
  const userId = req.userId;
  try {
    const { id } = req.params;

    // Check ownership
    const existingPost = await prisma.communityPost.findUnique({
      where: { id },
    });

    if (!existingPost || existingPost.deletedAt) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    if (existingPost.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own posts',
      });
    }

    const validatedData = updatePostSchema.parse(req.body);

    const post = await prisma.communityPost.update({
      where: { id },
      data: validatedData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        petIp: {
          select: {
            id: true,
            name: true,
            generatedImage: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: error.errors,
      });
    }
    console.error('[Community] Update post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update post',
    });
  }
});

// DELETE /api/community/posts/:id - Soft delete post
router.delete('/posts/:id', authenticateToken, async (req, res) => {
  const userId = req.userId;
  try {
    const { id } = req.params;

    const post = await prisma.communityPost.findUnique({
      where: { id },
    });

    if (!post || post.deletedAt) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    if (post.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own posts',
      });
    }

    await prisma.communityPost.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('[Community] Delete post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete post',
    });
  }
});

// POST /api/community/posts/:id/like - Toggle like
router.post('/posts/:id/like', authenticateToken, async (req, res) => {
  const userId = req.userId;
  try {
    const { id } = req.params;

    const post = await prisma.communityPost.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!post || post.deletedAt) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Check if already liked
    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.postLike.delete({
        where: { id: existingLike.id },
      });

      await prisma.communityPost.update({
        where: { id },
        data: { likes: { decrement: 1 } },
      });

      res.json({
        success: true,
        data: { liked: false, likes: Math.max(0, post.likes - 1) },
      });
    } else {
      // Like
      await prisma.postLike.create({
        data: {
          postId: id,
          userId,
        },
      });

      await prisma.communityPost.update({
        where: { id },
        data: { likes: { increment: 1 } },
      });

      // Create notification for post author (if not self)
      if (post.userId !== userId) {
        await createNotification(post.userId, id, null, 'like', prisma);
      }

      res.json({
        success: true,
        data: { liked: true, likes: post.likes + 1 },
      });
    }
  } catch (error) {
    console.error('[Community] Toggle like error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle like',
    });
  }
});

// POST /api/community/posts/:id/favorite - Toggle favorite
router.post('/posts/:id/favorite', authenticateToken, async (req, res) => {
  const userId = req.userId;
  try {
    const { id } = req.params;

    const post = await prisma.communityPost.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!post || post.deletedAt) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Check if already favorited
    const existingFavorite = await prisma.postFavorite.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId,
        },
      },
    });

    if (existingFavorite) {
      // Unfavorite
      await prisma.postFavorite.delete({
        where: { id: existingFavorite.id },
      });

      res.json({
        success: true,
        data: { favorited: false },
      });
    } else {
      // Favorite
      await prisma.postFavorite.create({
        data: {
          postId: id,
          userId,
        },
      });

      // Create notification for post author (if not self)
      if (post.userId !== userId) {
        await createNotification(post.userId, id, null, 'favorite', prisma);
      }

      res.json({
        success: true,
        data: { favorited: true },
      });
    }
  } catch (error) {
    console.error('[Community] Toggle favorite error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle favorite',
    });
  }
});

// GET /api/community/posts/:id/comments - Get comments (threaded)
router.get('/posts/:postId/comments', optionalAuth, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!post || post.deletedAt) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    const comments = await prisma.comment.findMany({
      where: {
        postId,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const threadedComments = buildThreadedComments(comments);

    res.json({
      success: true,
      data: threadedComments,
    });
  } catch (error) {
    console.error('[Community] Get comments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get comments',
    });
  }
});

// POST /api/community/posts/:postId/comments - Create comment
router.post('/posts/:postId/comments', authenticateToken, async (req, res) => {
  const userId = req.userId;
  try {
    const { postId } = req.params;

    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
      include: { user: true },
    });

    if (!post || post.deletedAt) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    const validatedData = createCommentSchema.parse(req.body);

    // If parentId is provided, verify it belongs to the same post
    if (validatedData.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: validatedData.parentId },
      });

      if (!parentComment || parentComment.postId !== postId || parentComment.deletedAt) {
        return res.status(400).json({
          success: false,
          error: 'Parent comment not found or does not belong to this post',
        });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        userId,
        ...validatedData,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    // Create notification
    if (validatedData.parentId) {
      // Reply to comment - notify comment author
      const parentComment = await prisma.comment.findUnique({
        where: { id: validatedData.parentId },
      });

      if (parentComment && parentComment.userId !== userId) {
        await createNotification(parentComment.userId, postId, comment.id, 'reply', prisma);
      }
    } else {
      // Comment on post - notify post author
      if (post.userId !== userId) {
        await createNotification(post.userId, postId, comment.id, 'comment', prisma);
      }
    }

    res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: error.errors,
      });
    }
    console.error('[Community] Create comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create comment',
    });
  }
});

// PATCH /api/community/comments/:id - Update comment
router.patch('/comments/:id', authenticateToken, async (req, res) => {
  const userId = req.userId;
  try {
    const { id } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment || comment.deletedAt) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found',
      });
    }

    if (comment.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own comments',
      });
    }

    const validatedData = updateCommentSchema.parse(req.body);

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: { content: validatedData.content },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedComment,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: error.errors,
      });
    }
    console.error('[Community] Update comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update comment',
    });
  }
});

// DELETE /api/community/comments/:id - Soft delete comment
router.delete('/comments/:id', authenticateToken, async (req, res) => {
  const userId = req.userId;
  try {
    const { id } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment || comment.deletedAt) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found',
      });
    }

    if (comment.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own comments',
      });
    }

    await prisma.comment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('[Community] Delete comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete comment',
    });
  }
});

// GET /api/community/notifications - Get notifications
router.get('/notifications', authenticateToken, async (req, res) => {
  const userId = req.userId;
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const where = { userId };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          post: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
              petIp: {
                select: {
                  id: true,
                  name: true,
                  generatedImage: true,
                },
              },
            },
          },
          comment: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.notification.count({ where }),
    ]);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('[Community] Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notifications',
    });
  }
});

// PATCH /api/community/notifications/:id/read - Mark notification as read
router.patch('/notifications/:id/read', authenticateToken, async (req, res) => {
  const userId = req.userId;
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found',
      });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only mark your own notifications as read',
      });
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('[Community] Mark notification read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
    });
  }
});

// PATCH /api/community/notifications/read-all - Mark all notifications as read
router.patch('/notifications/read-all', authenticateToken, async (req, res) => {
  const userId = req.userId;
  try {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('[Community] Mark all read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read',
    });
  }
});

export default router;
