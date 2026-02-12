"use client";

import { useState } from "react";
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

// 示例作品数据
const COMMUNITY_POSTS = [
  {
    id: 1,
    title: "赛博喵星人 Z-7",
    tags: ["#赛博朋克", "#机甲"],
    rarity: "3D MODEL",
    rarityColor: "cyan",
    author: "喵力无限",
    authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAd5AZX7xMYQSGi4IXlXamTGYA8-Gde5jOGy0wcT_pYk0kj_t7C2RAIl2vA-hQEcbTj6XJTDTl9Ql1UK1I_0zPQZ7_44cK0o5uzrLSnFp9gaP_o89M7OjhmqApsptD4iZtuyrtUnYmlzYek0JX4BbqAeC1_QaowoQ8PD6878qMHWJLziwNRwPgc-n-DdSb2CFXMRkhkYc1aXqiJXrWbEy9nv_xuq4dEnwmB5_kctNnLvHkPyY6-FJaC3-I9EXp8ntjXBPB7cWw5Ps4",
    likes: "1.2k",
    liked: false,
    bookmarked: false,
    aspect: "aspect-[3/4]",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBWUUoRmp1MXQhj5KYDAhfB1_33vOoN1ov13qxzOMswTU330j9r69GjL9HsRKzdpGCzcrFI5gd3cl47Ih2s15oyqML3m5NIWk-Wgh2zulJBA4j6A2jd4HSvj2EVLPY55zq5IYNkQcrxzzuoKfMdfVFILNPpr9Xl_br5MkXR2X8WBzzuGBeTY3LW2bO0QandarrrWnL-n6dJiL5cPdkOMKyU01XQvaMEdmBW3GpaLoMkah_mjO33deGbPWxF5u6GzUyt8oMD32FaOaI",
  },
  {
    id: 2,
    title: "仿生金毛 Type-A",
    tags: ["#治愈系", "#超写实"],
    rarity: "",
    rarityColor: "",
    author: "汪星探长",
    authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuD0_NrmHBqt9Cn0IjX0RZXiuElDntMhlewc-yus58pgZ5kTx3omcv87NXAarvgsnF3r0wMwScmfPtGqQvYp4Hh2koEcWKSEzoS71gTi79bcGoJlFhM95tq4vKYpbfAuqZu9LANt_yPHWNIRL8aruOVZLyLFX-8cpRffwNVRffj6BW5YqIo1PAQ6Jt11snK4qkbXvQyeTpgmCD6VL0xF83BUaxgAdeg_nMm-gib-_dpMSSxztWS8tUfabI2RS1lHaqVWqfOiFaFLlbE",
    likes: "856",
    liked: true,
    bookmarked: false,
    aspect: "aspect-square",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD6-lqiludu4MC0GZY1WGJKRglO-hhnA1_IGiKjr-hlt_qBqdgdlc-uc8oHWeHTHkGrdstd5SG_LWuzRgisblPF7i2z7JXusnAE4v_E43Ce0_cyzmryEWJsCfs-vO9uY0uJPhoMEzyHbkwM1EPsw7CmsjeiBBoxgSJqgiOPPuNPww1Y1JzbSYeJpwEo3Zdji4nYd3Z-kfzW59dRVmOJRjiSoL4i-tNOEt-WFgT7E_h-Min2KVIFW7PoxUi8M05P1SqIkG-dvdqLYH0",
  },
  {
    id: 3,
    title: "太空漫游者 No.42",
    tags: ["#星际", "#概念艺术"],
    rarity: "NFT ART",
    rarityColor: "purple",
    author: "绘梦师",
    authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAzkgrXicyAhXvB4hX1KwmhUf_Ivwiu4jV-0kk_Rv0JslGoIPyst85dMSYyzf7K6jLA-LOenvWIofB28l1HcvRCeMvxL8DaggST65Mdg4xrGywFe4RVnnedjy0VUP447okTm_IshlpbLGsQRG9arYzkk37Vulbg9bnwDRRAuSz1dL62poaf0hVyHd2wksIFwLBthvRYqNt0Dq1dOQC3QsZPEAerRe2iZnsWy9h71IFvNk5yane2uITcyWMk_BsOLpTmcPMwCGeMZw",
    likes: "3.4k",
    liked: false,
    bookmarked: true,
    aspect: "aspect-[3/5]",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAJsWheUnOGeOYY7p2C6fZn25hFBw6K7y1t8J1mJvB10cgJz9P4FgVMQEfDhlaUPu06UX0hoc-ecOkPMksp3lT577p5pLSkVO8H_YCuN4vWSdhpdlhsCb-TVhpUTlFg7xK1UJCpJORg9NgsntXc6-XkM-B22JUqoLdJ8RC_UbIYAnpQrqTouqELSyfJ1sdRnVj8H93m81S51ZkPfgYf_tugWPvZ9FPlJKcESuEFbBVvp1GYo77C8FX_THQA6CUr9VQiEZ4yGO5epc0",
  },
  {
    id: 4,
    title: "机械柯基原型机",
    tags: ["#柯基", "#动能模组"],
    rarity: "",
    rarityColor: "",
    author: "Kevin.Design",
    authorAvatar: "",
    authorInitial: "K",
    likes: "230",
    liked: false,
    bookmarked: false,
    aspect: "aspect-[4/3]",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAld-3--YA7870C7QPR1lmvA5NUF3pUWbDrHo8xhky30aouqno5BMXNlr9ma6brVv-Hse9UshzTkfH3BfNJR3b9KdUL6nSk6GRHAuxJuAfZIsCXGf5FYHw0jvNJZuNpwXpAByRS2-cbdLh1EddTl8JeLCdJVptpz4MjDMjs4UXmlgAmErEJzJ1IrSm4y4FSUtdXE3_diymKPpJGyhADKqU0wKXEz7HV73Lq8Pu6FYXWcsClEOqrTUdwcUo0Q_ieQrOS-xi9HTOQ",
  },
  {
    id: 5,
    title: "幽能灵猫",
    tags: ["#暗能系", "#异界生物"],
    rarity: "LIMITED",
    rarityColor: "purple-dark",
    author: "NightOwl",
    authorAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBP2xAB3xno8cseSXUIgwPpqMuEPO5nXrmatC3YNDUDNeX67OWrQdV_U4OvLB06D2964HnHcGzWLGYzRfwkBfVEPUrdiNU6tEZjrfKeZf3MPFg-GoLfr3K_slQMtZZR4uCaaUlipn2G5lRt4QY3NBeO1zVo7odktppE5a34mGYHoY0xD_UiiLhrJatg7-MTERY4osTuTR0EY1D2PYYpZvWIotUoK6i45OXU0kZK-RPPp4H8X-MEG2NQROlm8x5af3LmBh2CENDbgiI",
    likes: "99+",
    liked: false,
    bookmarked: false,
    aspect: "aspect-[3/4]",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDWq-l5j8qeVrj6B5mfiOP865_CnBCwfaby_bra1H62PysXvgKAWJ9xawunkFKWfEXnYQZQaHavdUJjrkWnBbomgiaUplATliFjf8VyAKsMMgH1LinF0w4GxMeHYSfs9CLqItkesffbaIZWzkPQzc2xuBIONPtS2Fyg21dXs7Fp6j77vg7u4ROeKIK96mZChLntPIYDtkdUcOaRbN91HOmUh_zu_tpyCFphM3mVZ0-0vSx2jL1zx0XSX-fHaK9fyN_2MuHTtZFkfg",
  },
  {
    id: 6,
    title: "潮流教主 X",
    tags: ["#街头时尚", "#虚拟偶像"],
    rarity: "",
    rarityColor: "",
    author: "MomoChan",
    authorAvatar: "",
    authorInitial: "M",
    likes: "452",
    liked: false,
    bookmarked: false,
    aspect: "aspect-square",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAO6US5Pom_5DqTxtRffp4sMhNgmaFOD3juKwgJyApbKjp4LTwMO_Dp_GLISUGADSI8tSHc6bbBC0PzAk18RYa_vRt4Ie9yvHOk0ZV_u_iIvjwtP3bLau8MJW-FxsyXXH4dPfhJs7Z2sl-wI-T03tR4PxBmiQut1UA47JAhX-Cmjcl_Mn5gz7O9HQPHaLg4sMyblPCAmqmS-Un9e54RbY1qh17fooyfNKeNrQ1_60M-afk5-7sU1NVBzM2UbJtwZgkaZpmFqWiBY",
  },
];

const TAGS = ["今日推荐", "人气榜单 🔥", "赛博朋克", "机甲兽", "全息幻影"];

export default function CommunityPage() {
  const [selectedTag, setSelectedTag] = useState("今日推荐");
  const [posts, setPosts] = useState(COMMUNITY_POSTS);

  const toggleLike = (id: number) => {
    setPosts(
      posts.map((post) =>
        post.id === id ? { ...post, liked: !post.liked } : post
      )
    );
  };

  const toggleBookmark = (id: number) => {
    setPosts(
      posts.map((post) =>
        post.id === id ? { ...post, bookmarked: !post.bookmarked } : post
      )
    );
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
              href="/upload"
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-secondary hover:bg-tech-border border border-tech-border hover:border-slate-600 text-slate-300 hover:text-white rounded-full transition-all text-sm font-medium"
            >
              <AddCircleIcon className="text-lg text-accent-cyan" />
              <span>创建 IP</span>
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
              AI 创世引擎 V2.0
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight tracking-tight">
              重塑你的<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-glow to-accent-cyan">
                数字宠物宇宙
              </span>
            </h1>
            <p className="text-slate-400 text-lg mb-8 max-w-lg font-light">
              基于深度学习生成独一无二的 3D 宠物 IP，支持 VR 预览与实体周边一键定制。
            </p>
            <div className="flex gap-4">
              <Link
                href="/upload"
                className="px-8 py-3 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary-glow hover:to-indigo-500 text-white rounded-full font-semibold shadow-lg shadow-primary/25 transition-all transform hover:-translate-y-1 border border-white/10"
              >
                立即生成
              </Link>
              <button className="px-8 py-3 bg-secondary hover:bg-tech-border text-slate-300 hover:text-white rounded-full font-semibold shadow-sm transition-all border border-tech-border flex items-center gap-2">
                <span>▶</span>
                演示视频
              </button>
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
                    : "bg-secondary hover:bg-tech-border border border-tech-border hover:border-slate-600 text-slate-400 hover:text-white"
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
        <div className="masonry-grid">
          {posts.map((post) => (
            <div key={post.id} className="masonry-item relative group break-inside-avoid">
              <div className="bg-tech-card rounded-2xl overflow-hidden shadow-tech hover:shadow-tech-hover transition-all duration-500 border border-tech-border hover:border-primary/30">
                {/* Image */}
                <div className={`relative overflow-hidden ${post.aspect}`}>
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {post.rarity && (
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span
                        className={`backdrop-blur-md text-[10px] font-bold px-2.5 py-1 rounded-full border tracking-wide ${
                          post.rarityColor === "cyan"
                            ? "bg-black/60 text-accent-cyan border-accent-cyan/30"
                            : post.rarityColor === "purple"
                            ? "bg-secondary/90 text-primary-glow border-primary/20"
                            : "bg-purple-900/80 text-purple-200 border-purple-500/30"
                        }`}
                      >
                        {post.rarity}
                      </span>
                    </div>
                  )}

                  {/* Hover Action Button */}
                  <div className="absolute inset-0 bg-gradient-to-t from-tech-dark via-tech-dark/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                    <button className="bg-white text-tech-dark hover:bg-accent-cyan hover:text-white px-6 py-2.5 rounded-full font-bold shadow-lg shadow-black/50 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-2 text-sm">
                      <SmartToyIcon className="text-sm" />
                      生成同款
                    </button>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-white text-lg tracking-wide group-hover:text-primary-glow transition-colors">
                        {post.title}
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {post.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="text-[10px] px-2 py-0.5 rounded bg-secondary text-slate-400 border border-tech-border"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Author & Actions */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-tech-border">
                    <div className="flex items-center gap-2.5">
                      {post.authorAvatar ? (
                        <div className="relative">
                          <img
                            src={post.authorAvatar}
                            alt={post.author}
                            className="w-7 h-7 rounded-full ring-2 ring-tech-dark"
                          />
                          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-tech-dark"></div>
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-tech-dark">
                          {post.authorInitial}
                        </div>
                      )}
                      <span className="text-xs font-medium text-slate-300">{post.author}</span>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => toggleLike(post.id)}
                        className={`flex items-center gap-1.5 transition-colors ${
                          post.liked ? "text-pink-500" : "text-slate-500 hover:text-pink-500"
                        }`}
                      >
                        <span className="text-lg group-hover/btn:scale-110 transition-transform">♥</span>
                        <span className={`text-xs font-medium ${post.liked ? "" : "group-hover/btn:text-pink-500"}`}>
                          {post.likes}
                        </span>
                      </button>
                      <button
                        onClick={() => toggleBookmark(post.id)}
                        className={`transition-colors ${
                          post.bookmarked ? "text-accent-cyan" : "text-slate-500 hover:text-accent-cyan"
                        }`}
                      >
                        <span className="text-lg group-hover/btn:scale-110 transition-transform">⬭</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        <div className="flex justify-center mt-12 mb-8">
          <button className="flex items-center gap-2 px-8 py-3 bg-secondary hover:bg-tech-border text-slate-300 hover:text-white rounded-full font-medium transition-colors border border-tech-border hover:border-primary/50 shadow-lg shadow-black/20 group">
            <RefreshIcon className="animate-spin text-lg group-hover:text-primary-glow" />
            加载更多数据流
          </button>
        </div>
      </main>

      {/* Mobile FAB */}
      <div className="fixed bottom-6 right-6 sm:hidden z-50">
        <Link
          href="/upload"
          className="w-14 h-14 bg-gradient-to-br from-primary to-indigo-600 text-white rounded-full shadow-lg shadow-primary/40 flex items-center justify-center hover:scale-110 transition-transform"
        >
          <span className="text-2xl">+</span>
        </Link>
      </div>
    </div>
  );
}
