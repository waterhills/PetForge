"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  SmartToyIcon,
  SearchIcon,
  AddCircleIcon,
  FavoriteBorderIcon,
  BookmarkBorderIcon,
  RefreshIcon,
} from "@/components/ui/icons";
import Navigation from "@/components/layout/Navigation";
import { fetchPosts, toggleLike, toggleFavorite } from "@/lib/communityApi";
import type { CommunityPost } from "@/types/community";

const TAGS = ["今日推荐", "人气榜单 🔥", "赛博朋克", "机甲兽", "全息幻影"];

export default function CommunityPage() {
  const [selectedTag, setSelectedTag] = useState("今日推荐");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch posts
  const fetchPostsData = async (pageNum = page, reset = false) => {
    try {
      setError(null);
      if (reset) setLoading(true);

      const response = await fetchPosts({ page: pageNum, limit: 20 });

      if (response.success && response.data) {
        const newPosts = response.data;
        setPosts((prev) => (reset ? newPosts : [...prev, ...newPosts]));
        setHasMore(
          response.pagination
            ? pageNum < response.pagination.pages
            : false
        );
      }
    } catch (err) {
      console.error("Failed to fetch posts:", err);
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchPostsData(1, true);
  }, []);

  // Load more posts
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPostsData(nextPage, false);
    }
  };

  // Toggle like with API call
  const handleToggleLike = async (postId: string) => {
    try {
      const response = await toggleLike(postId);
      if (response.success && response.data) {
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  isLiked: response.data!.liked,
                  likes: response.data!.likes,
                }
              : post
          )
        );
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  // Toggle favorite with API call
  const handleToggleFavorite = async (postId: string) => {
    try {
      const response = await toggleFavorite(postId);
      if (response.success && response.data) {
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, isFavorited: response.data!.favorited }
              : post
          )
        );
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  return (
    <div className="bg-tech-dark text-slate-200 font-sans antialiased selection:bg-primary selection:text-white">
      {/* Navigation with User Avatar Dropdown */}
      <Navigation />

      {/* Search Bar Section */}
      <div className="sticky top-20 z-40 bg-tech-dark/90 backdrop-blur-xl border-b border-tech-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Bar */}
            <div className="flex-1 max-w-lg">
              <div className="relative w-full group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <SearchIcon className="text-slate-500 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  className="block w-full pl-11 pr-4 py-2.5 bg-secondary border border-tech-border rounded-full text-sm text-slate-200 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:bg-tech-card transition-all placeholder-slate-500"
                  placeholder="搜索赛博萌宠、3D资产或创作者..."
                  type="text"
                />
              </div>
            </div>

            {/* Create IP Button */}
            <Link
              href="/community/create"
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-secondary hover:bg-tech-border border border-tech-border hover:border-slate-600 text-slate-300 hover:text-white rounded-full transition-all text-sm font-medium"
            >
              <AddCircleIcon className="text-lg text-accent-cyan" />
              <span>发布动态</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Banner */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative w-full rounded-2xl overflow-hidden mb-12 h-64 md:h-80 shadow-tech group border border-tech-border">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-tech-dark z-0"></div>
          <div className="absolute right-0 top-0 w-2/3 h-full bg-[url('https://images.unsplash.com/photo-1615751072497-5f5169febeca?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-tech-dark via-transparent to-transparent opacity-80"></div>

          <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-16 max-w-3xl">
            <span className="inline-flex items-center gap-1 py-1 px-3 rounded-full bg-primary/10 border border-primary/20 backdrop-blur text-primary-glow text-xs font-bold uppercase tracking-wider mb-4 w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse"></span>
              AI 生成引擎 V2.0
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight tracking-tight">
              重塑你的<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-glow to-accent-cyan">
                数字宠物宇宙
              </span>
            </h1>
            <p className="text-slate-400 text-lg mb-8 max-w-lg font-light">
              基于深度学习生成独一无二的 3D 宠物 IP，支持 VR 浏览与实体周边一键定制。
            </p>
            <div className="flex gap-4">
              <Link
                href="/community/create"
                className="px-8 py-3 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary-glow hover:to-indigo-500 text-white rounded-full font-semibold shadow-lg shadow-primary/25 transition-all transform hover:-translate-y-1 border border-white/10"
              >
                立即发布
              </Link>
            </div>
          </div>
        </div>

        {/* Tag Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div className="flex overflow-x-auto no-scrollbar gap-3 pb-2 md:pb-0 items-center">
            {TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`whitespace-nowrap px-6 py-2.5 rounded-full font-medium transition-all text-sm ${
                  selectedTag === tag
                    ? "bg-tech-card text-white border border-primary/50 shadow-[0_0_15px_rgba(139,92,246,0.4)] animate-pulse-glow relative overflow-hidden"
                    : "bg-secondary hover:bg-tech-card border border-tech-border hover:border-slate-600 text-slate-400 hover:text-white"
                }`}
              >
                {selectedTag === tag && (
                  <div className="absolute inset-0 bg-primary/10"></div>
                )}
                <span className="relative z-10">{tag}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer hover:text-white transition-colors">
            <span>⚙</span>
            <span>高级筛选</span>
          </div>
        </div>

        {/* Masonry Grid */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="masonry-grid">
          {posts.map((post) => (
            <div key={post.id} className="masonry-item relative group break-inside-avoid">
              <div className="bg-tech-card rounded-2xl overflow-hidden shadow-tech hover:shadow-tech-hover transition-all duration-500 border border-tech-border hover:border-primary/30">
                {/* Image */}
                <div className="relative overflow-hidden aspect-square">
                  <img
                    src={post.petIp?.generatedImage || "https://via.placeholder.com/400"}
                    alt={post.content}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {/* Hover Action Button */}
                  <div className="absolute inset-0 bg-gradient-to-t from-tech-dark via-tech-dark/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                    <Link
                      href={`/community/post/${post.id}`}
                      className="bg-white text-tech-dark hover:bg-accent-cyan hover:text-white px-6 py-2.5 rounded-full font-bold shadow-lg shadow-black/50 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-2 text-sm"
                    >
                      <SmartToyIcon className="text-sm" />
                      查看详情
                    </Link>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-white text-lg tracking-wide group-hover:text-primary-glow transition-colors">
                        {post.petIp?.name || "社区动态"}
                      </h3>
                      <p className="text-slate-400 text-sm mt-2 line-clamp-2">
                        {post.content}
                      </p>
                    </div>
                  </div>

                  {/* Author & Actions */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-tech-border">
                    <div className="flex items-center gap-2.5">
                      {post.user.avatar ? (
                        <div className="relative">
                          <img
                            src={post.user.avatar}
                            alt={post.user.name}
                            className="w-7 h-7 rounded-full ring-2 ring-tech-dark"
                          />
                          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-tech-dark"></div>
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-tech-dark">
                          {post.user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs font-medium text-slate-300">{post.user.name}</span>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleToggleLike(post.id)}
                        className={`flex items-center gap-1.5 transition-colors ${
                          post.isLiked ? "text-pink-500" : "text-slate-500 hover:text-pink-500"
                        }`}
                      >
                        <span className="text-lg group-hover/btn:scale-110 transition-transform">♥</span>
                        <span className={`text-xs font-medium ${post.isLiked ? "" : "group-hover/btn:text-pink-500"}`}>
                          {post.likes}
                        </span>
                      </button>
                      <button
                        onClick={() => handleToggleFavorite(post.id)}
                        className={`transition-colors ${
                          post.isFavorited ? "text-accent-cyan" : "text-slate-500 hover:text-accent-cyan"
                        }`}
                      >
                        <span className="text-lg group-hover/btn:scale-110 transition-transform">⭐</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="flex justify-center py-12">
            <RefreshIcon className="animate-spin text-4xl text-primary-glow" />
          </div>
        )}

        {/* Load More Button */}
        {!loading && hasMore && posts.length > 0 && (
          <div className="flex justify-center mt-12 mb-8">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-secondary hover:bg-tech-card text-slate-300 hover:text-white rounded-full font-medium transition-colors border border-tech-border hover:border-primary/50 shadow-lg shadow-black/20 group disabled:opacity-50"
            >
              <RefreshIcon className={`text-lg group-hover:text-primary-glow ${loading ? "animate-spin" : ""}`} />
              加载更多
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-xl font-bold text-white mb-2">暂无内容</h3>
            <p className="text-slate-400">成为第一个发布动态的用户吧！</p>
            <Link
              href="/community/create"
              className="mt-6 px-6 py-3 bg-primary hover:bg-primary-glow text-white rounded-full font-semibold transition-all"
            >
              立即发布
            </Link>
          </div>
        )}
      </main>

      {/* Mobile FAB */}
      <div className="fixed bottom-6 right-6 sm:hidden z-50">
        <Link
          href="/community/create"
          className="w-14 h-14 bg-gradient-to-br from-primary to-indigo-600 text-white rounded-full shadow-lg shadow-primary/40 flex items-center justify-center hover:scale-110 transition-transform"
        >
          <span className="text-2xl">+</span>
        </Link>
      </div>
    </div>
  );
}
