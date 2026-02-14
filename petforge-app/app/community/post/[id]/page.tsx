"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/layout/Navigation";
import {
  fetchPost,
  fetchComments,
  createComment,
  toggleLike,
  toggleFavorite,
} from "@/lib/communityApi";
import type { CommunityPost, Comment } from "@/types/community";

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Fetch post and comments
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [postData, commentsData] = await Promise.all([
          fetchPost(postId),
          fetchComments(postId),
        ]);

        if (postData.success && postData.data) {
          setPost(postData.data);
        }

        if (commentsData.success && commentsData.data) {
          setComments(commentsData.data);
        }
      } catch (err) {
        console.error("Failed to fetch post:", err);
        setError(err instanceof Error ? err.message : "加载失败");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [postId]);

  // Handle like
  const handleToggleLike = async () => {
    if (!post) return;

    try {
      const response = await toggleLike(post.id);
      if (response.success && response.data) {
        setPost({
          ...post,
          isLiked: response.data!.liked,
          likes: response.data!.likes,
        });
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  // Handle favorite
  const handleToggleFavorite = async () => {
    if (!post) return;

    try {
      const response = await toggleFavorite(post.id);
      if (response.success && response.data) {
        setPost({
          ...post,
          isFavorited: response.data!.favorited,
        });
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  // Handle submit comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentContent.trim()) return;

    try {
      setSubmittingComment(true);
      const response = await createComment(postId, {
        content: commentContent.trim(),
      });

      if (response.success && response.data) {
        setCommentContent("");
        // Refetch comments
        const commentsData = await fetchComments(postId);
        if (commentsData.success && commentsData.data) {
          setComments(commentsData.data);
        }
      }
    } catch (err) {
      console.error("Failed to create comment:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Handle submit reply
  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    try {
      setSubmittingComment(true);
      const response = await createComment(postId, {
        content: replyContent.trim(),
        parentId,
      });

      if (response.success && response.data) {
        setReplyContent("");
        setReplyingTo(null);
        // Refetch comments
        const commentsData = await fetchComments(postId);
        if (commentsData.success && commentsData.data) {
          setComments(commentsData.data);
        }
      }
    } catch (err) {
      console.error("Failed to create reply:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Comment item component (recursive)
  const CommentItem = ({
    comment,
    depth = 0,
  }: {
    comment: Comment;
    depth?: number;
  }) => {
    const maxDepth = 4;

    if (depth >= maxDepth) {
      return null;
    }

    return (
      <div
        className={`border-l-2 ${depth > 0 ? "border-slate-700/50 ml-4 md:ml-6" : "border-primary/20"}`}
      >
        <div className="flex gap-3 py-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {comment.user.avatar ? (
              <img
                src={comment.user.avatar}
                alt={comment.user.name}
                className="w-8 h-8 rounded-full ring-2 ring-tech-dark"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white ring-2 ring-tech-dark">
                {comment.user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-slate-200">{comment.user.name}</span>
              <span className="text-xs text-slate-500">
                {new Date(comment.createdAt).toLocaleString("zh-CN")}
              </span>
            </div>
            <p className="text-slate-300 text-sm mb-2">{comment.content}</p>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="text-xs text-slate-500 hover:text-primary transition-colors"
              >
                {replyingTo === comment.id ? "取消" : "回复"}
              </button>
            </div>

            {/* Reply Form */}
            {replyingTo === comment.id && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmitReply(comment.id);
                }}
                className="mt-3"
              >
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`回复 ${comment.user.name}...`}
                  className="w-full px-3 py-2 bg-tech-card border border-tech-border rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent"
                  autoFocus
                />
                <div className="flex justify-end mt-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyContent("");
                    }}
                    className="px-3 py-1.5 text-sm bg-secondary hover:bg-tech-card text-slate-400 hover:text-white rounded-lg transition-colors border border-tech-border"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={submittingComment || !replyContent.trim()}
                    className="px-3 py-1.5 text-sm bg-primary hover:bg-primary-glow text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {submittingComment ? "发送中..." : "发送"}
                  </button>
                </div>
              </form>
            )}

            {/* Nested Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="space-y-4 mt-4">
                {comment.replies.map((reply) => (
                  <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-tech-dark text-slate-200 font-sans antialiased min-h-screen">
        <Navigation />
        <div className="flex justify-center items-center h-[calc(100vh-5rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="bg-tech-dark text-slate-200 font-sans antialiased min-h-screen">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <Link
            href="/community"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <span>←</span>
            <span>返回社区</span>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-tech-dark text-slate-200 font-sans antialiased selection:bg-primary selection:text-white">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/community"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <span>←</span>
            <span>返回社区</span>
          </Link>
        </div>

        {/* Post */}
        <div className="bg-tech-card rounded-2xl overflow-hidden shadow-tech border border-tech-border mb-8">
          {/* Image */}
          {post.petIp?.generatedImage && (
            <div className="relative aspect-video max-h-[500px] overflow-hidden">
              <img
                src={post.petIp.generatedImage}
                alt={post.petIp.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-6 md:p-8">
            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
              {post.petIp?.name || "社区动态"}
            </h1>

            {/* Author & Time */}
            <div className="flex items-center gap-3 mb-6">
              {post.user.avatar ? (
                <img
                  src={post.user.avatar}
                  alt={post.user.name}
                  className="w-10 h-10 rounded-full ring-2 ring-tech-dark"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white ring-2 ring-tech-dark">
                  {post.user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-medium text-slate-200">{post.user.name}</p>
                <p className="text-xs text-slate-500">
                  {new Date(post.createdAt).toLocaleString("zh-CN")}
                </p>
              </div>
            </div>

            {/* Content */}
            <p className="text-slate-300 text-lg leading-relaxed mb-6 whitespace-pre-wrap">
              {post.content}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-6 border-t border-tech-border">
              <button
                onClick={handleToggleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  post.isLiked
                    ? "bg-pink-500/10 text-pink-500 border border-pink-500/30"
                    : "bg-secondary text-slate-400 hover:text-pink-500 border border-tech-border hover:border-slate-600"
                }`}
              >
                <span>♥</span>
                <span>{post.likes}</span>
              </button>
              <button
                onClick={handleToggleFavorite}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  post.isFavorited
                    ? "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30"
                    : "bg-secondary text-slate-400 hover:text-accent-cyan border border-tech-border hover:border-slate-600"
                }`}
              >
                <span>⭐</span>
                <span>{post.isFavorited ? "已收藏" : "收藏"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-tech-card rounded-2xl shadow-tech border border-tech-border p-6 md:p-8">
          <h2 className="text-xl font-bold text-white mb-6">评论 ({comments.length})</h2>

          {/* Comment Form */}
          <form onSubmit={handleSubmitComment} className="mb-8">
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="发表评论..."
              className="w-full px-4 py-3 bg-tech-card border border-tech-border rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent resize-none h-24 mb-3"
              maxLength={1000}
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingComment || !commentContent.trim()}
                className="px-6 py-2 bg-primary hover:bg-primary-glow text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingComment ? "发送中..." : "发表评论"}
              </button>
            </div>
          </form>

          {/* Comments List */}
          {comments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">暂无评论，快来抢沙发吧~</p>
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
