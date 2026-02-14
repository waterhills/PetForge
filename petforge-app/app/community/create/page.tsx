"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/layout/Navigation";
import { createPost } from "@/lib/communityApi";
import api from "@/lib/api";
import type { PetIP } from "@/types/community";

export default function CreatePostPage() {
  const router = useRouter();
  const [petIPs, setPetIPs] = useState<PetIP[]>([]);
  const [selectedPetIP, setSelectedPetIP] = useState<PetIP | null>(null);
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetchingPetIPs, setFetchingPetIPs] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's PetIPs
  useEffect(() => {
    const fetchUserPetIPs = async () => {
      try {
        setFetchingPetIPs(true);
        const response = await api.getPetIPs({ userId: "current", limit: 100 });
        if (response.success && response.data) {
          setPetIPs(response.data);
        }
      } catch (err) {
        console.error("Failed to fetch PetIPs:", err);
        setError(err instanceof Error ? err.message : "加载失败");
      } finally {
        setFetchingPetIPs(false);
      }
    };

    fetchUserPetIPs();
  }, []);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPetIP) {
      setError("请选择一个 IP 形象");
      return;
    }

    if (!content.trim()) {
      setError("请输入内容");
      return;
    }

    if (content.length > 2000) {
      setError("内容不能超过 2000 字");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await createPost({
        petIpId: selectedPetIP.id,
        content: content.trim(),
        isPublic,
      });

      if (response.success) {
        // Redirect to community page
        router.push("/community");
      }
    } catch (err) {
      console.error("Failed to create post:", err);
      setError(err instanceof Error ? err.message : "发布失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-tech-dark text-slate-200 font-sans antialiased selection:bg-primary selection:text-white min-h-screen">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/community"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <span>←</span>
            <span>返回社区</span>
          </Link>
          <h1 className="text-3xl font-bold text-white">发布动态</h1>
          <p className="text-slate-400 mt-2">分享你的 IP 形象到社区</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Select PetIP */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              选择 IP 形象 <span className="text-red-400">*</span>
            </label>

            {fetchingPetIPs ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary border-t-transparent"></div>
              </div>
            ) : petIPs.length === 0 ? (
              <div className="bg-tech-card border border-tech-border rounded-lg p-8 text-center">
                <p className="text-slate-400 mb-4">你还没有 IP 形象</p>
                <Link
                  href="/upload"
                  className="inline-block px-6 py-2 bg-primary hover:bg-primary-glow text-white rounded-full font-medium transition-all"
                >
                  创建 IP 形象
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                {petIPs.map((petIP) => (
                  <button
                    key={petIP.id}
                    type="button"
                    onClick={() => setSelectedPetIP(petIP)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                      selectedPetIP?.id === petIP.id
                        ? "border-primary shadow-[0_0_20px_rgba(139,92,246,0.5)]"
                        : "border-tech-border hover:border-slate-500"
                    }`}
                  >
                    <img
                      src={petIP.generatedImage}
                      alt={petIP.name}
                      className="w-full h-32 object-cover"
                    />
                    {selectedPetIP?.id === petIP.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-tech-dark to-transparent p-2">
                      <p className="text-sm font-medium text-white truncate">{petIP.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              内容 <span className="text-red-400">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="分享你的创作思路、设计理念或者任何想对社区说的话..."
              className="w-full px-4 py-3 bg-tech-card border border-tech-border rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent resize-none h-40"
              maxLength={2000}
            />
            <div className="flex justify-end mt-2">
              <span className={`text-sm ${content.length > 2000 ? "text-red-400" : "text-slate-500"}`}>
                {content.length} / 2000
              </span>
            </div>
          </div>

          {/* Privacy Settings */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              隐私设置
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`flex-1 px-4 py-3 rounded-lg border transition-all ${
                  isPublic
                    ? "bg-primary/10 border-primary text-white"
                    : "bg-tech-card border-tech-border text-slate-400 hover:border-slate-500 hover:text-white"
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h1.95M17 16H19a2 2 0 012 2V5a2 2 0 01-2-2h-1.95m-14 14h5a2 2 0 002-2v10a2 2 0 002 2h5a2 2 0 002 2V5a2 2 0 00-2-2h-5.95z" />
                </svg>
                公开
              </button>
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`flex-1 px-4 py-3 rounded-lg border transition-all ${
                  !isPublic
                    ? "bg-primary/10 border-primary text-white"
                    : "bg-tech-card border-tech-border text-slate-400 hover:border-slate-500 hover:text-white"
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v6a2 2 0 002-2h6a2 2 0 002-2V9a2 2 0 00-2-2h-6a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002 2V9a2 2 0 00-2-2h-6z" />
                </svg>
                私密
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {isPublic ? "所有人都可以看到" : "只有你可以看到"}
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Link
              href="/community"
              className="px-6 py-3 bg-secondary hover:bg-tech-card text-slate-300 hover:text-white rounded-lg font-medium transition-all border border-tech-border"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={loading || !selectedPetIP || !content.trim()}
              className="px-6 py-3 bg-primary hover:bg-primary-glow text-white rounded-lg font-medium transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "发布中..." : "发布动态"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
