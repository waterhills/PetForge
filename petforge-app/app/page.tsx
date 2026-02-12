import Link from "next/link";
import Navigation from "@/components/layout/Navigation";
import {
  AutoAwesomeIcon,
  PlayArrowIcon,
  VerifiedIcon,
  ViewInArIcon,
  LockIcon,
  ArrowForwardIcon,
  ShoppingBagIcon,
  FavoriteIcon,
  SmartToyIcon,
} from "@/components/ui/icons";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden selection:bg-primary selection:text-white">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-32 lg:pb-40">
        <div className="absolute inset-0 tech-grid z-0 opacity-30 pointer-events-none" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-center lg:text-left space-y-10">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary-light text-xs font-medium tracking-wide uppercase mb-2 backdrop-blur-sm">
                <span className="bg-primary animate-pulse rounded-full w-2 h-2 mr-2 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                AI 3.0 引擎已就绪
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold font-display text-white leading-tight">
                赋予您的爱宠 <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-pink-500 to-orange-500 text-glow">
                  数字灵魂
                </span>
              </h1>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
                超越照片的静态束缚。PetForge 运用前沿生成式 AI，为您打造具备赛博朋克美学与元宇宙交互能力的 3D 数字生命。
              </p>
              <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start pt-6">
                <Link
                  href="/upload"
                  className="relative overflow-hidden bg-white text-black px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 flex items-center justify-center gap-2 group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity" />
                  <AutoAwesomeIcon />
                  <span>立即铸造 IP</span>
                </Link>
                <button className="bg-transparent text-white border border-gray-600 hover:border-primary hover:text-primary-light hover:shadow-neon px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2">
                  <PlayArrowIcon />
                  观看演示
                </button>
              </div>
              <div className="pt-10 flex flex-wrap items-center justify-center lg:justify-start gap-8 text-sm text-gray-400 font-mono">
                <div className="flex items-center gap-2">
                  <VerifiedIcon className="text-primary text-base" />
                  <span>4K 超清渲染</span>
                </div>
                <div className="flex items-center gap-2">
                  <ViewInArIcon className="text-primary text-base" />
                  <span>OBJ/GLB 导出</span>
                </div>
                <div className="flex items-center gap-2">
                  <LockIcon className="text-primary text-base" />
                  <span>NFT 区块链认证</span>
                </div>
              </div>
            </div>
            <div className="relative lg:h-[600px] flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full opacity-50 blur-3xl transform scale-75" />
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Left Card - Original Photo */}
                <div className="absolute top-10 left-4 z-20 w-64 md:w-80 glass-card p-2 rounded-2xl shadow-2xl transform -rotate-6 hover:rotate-0 transition-transform duration-500 hover:z-40 border-glow">
                  <div className="aspect-[4/5] rounded-xl overflow-hidden bg-gray-900 relative group">
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDklrtL91wIlhG6aUBCzbjFIm1venpFNRplNQ4y2bS0qHjR5uXy4cqOdu69-BSfERXkMMP5JjbCSn9yf5P-4vmYFqRLHW-md3sOX-RhoJjaDL2_wrTTSWXnRB7D0WkmvP2I39oYIgwIp_0jii14BDCeWndYe_QgYeynTXSzMKLjF63vDuguM1g_syACTgpmVftcIT6Y8af9toDl9mTG1vYDjksgyjZ17JeKo1LqQYJ1RTnkcERyF51NHrqWOhTbu2A_5AVKjpgoARg"
                      alt="Pet Photo"
                      className="w-full h-full object-cover filter brightness-90 contrast-125"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute top-4 right-4 flex flex-col gap-1 items-end">
                      <div className="w-16 h-1 bg-green-500/80 rounded-full shadow-[0_0_5px_rgba(34,197,94,0.8)]" />
                      <div className="w-10 h-1 bg-green-500/50 rounded-full" />
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <p className="text-xs text-green-400 font-mono mb-1">SCANNING COMPLETE</p>
                      <p className="text-white font-bold text-lg">原始数据</p>
                    </div>
                  </div>
                </div>
                {/* Right Card - AI Generated */}
                <div className="absolute bottom-10 right-4 z-30 w-64 md:w-80 glass-card p-2 rounded-2xl shadow-2xl transform rotate-6 hover:rotate-0 transition-transform duration-500 border border-orange-500/50 hover:border-orange-500 hover:shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                  <div className="aspect-[4/5] rounded-xl overflow-hidden bg-gray-900 relative group">
                    <div className="absolute inset-0 bg-orange-500/10 z-10 mix-blend-overlay" />
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDEcHXVlB4CVP--kvw40tFj3lNV8LqriNUER7kcl78JA8ZDUgVUcSBKkCrv3Ydsm2RV6-vanW96ZVw5bE5WkXFauKBq2jjzHlxpeeWM55bUlGyBVjd2mrtHBLLobLNw_ZR4aQqonNg4nW0YH1SvOMdOQzzKOgTtFDd0LxAGJOfZIc1yNfqLIQxWOEHPG_hLocOpbEob63FbHaLAkAGcB4Q7ZIqyF8bR97eJr_w1Ui1uY0puaJi0ZtIW64mbAXKUrT8K4MBsm5pB8gU"
                      alt="Generated AI Pet"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 z-20 bg-black/60 backdrop-blur-md border border-orange-500/50 text-orange-400 text-xs px-2 py-1 rounded font-bold uppercase tracking-wider shadow-lg">
                      AI Generated
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent opacity-30 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-1000 z-20 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent z-20">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-orange-400 font-mono mb-0.5">STYLE: CYBERPUNK</p>
                          <p className="text-white font-bold">机械纪元 · 喵</p>
                        </div>
                        <button className="text-orange-400 hover:text-white transition-colors">
                          <SmartToyIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24 bg-background-dark relative border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl lg:text-4xl font-bold font-display text-white mb-4 text-glow">
              神经连接 · 四步重塑
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto font-light">
              无需任何 3D 建模知识，AI 算法将在云端为您完成复杂的渲染计算
            </p>
          </div>
          <div className="relative">
            <div className="hidden lg:block absolute top-12 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent -z-10" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              {[
                { icon: "upload_file", title: "上传源数据", desc: "上传您宠物的多角度照片，系统将自动识别骨骼结构。", color: "primary" },
                { icon: "tune", title: "风格参数化", desc: "选择渲染引擎参数：皮克斯光照、赛博霓虹或超写实纹理。", color: "orange" },
                { icon: "memory", title: "云端演算", desc: "高性能 GPU 集群实时渲染，生成可交互的 3D 全息模型。", color: "primary" },
                { icon: "widgets", title: "实体化输出", desc: "将数字资产转化为实体周边，或导出至 AR 增强现实应用。", color: "blue" },
              ].map((step, i) => (
                <div key={i} className="relative group cursor-pointer">
                  <div
                    className={`w-24 h-24 mx-auto bg-surface-card rounded-2xl rotate-45 flex items-center justify-center mb-10 shadow-lg border border-gray-800 group-hover:border-${step.color} group-hover:shadow-neon transition-all duration-300`}
                  >
                    <div className="-rotate-45">
                      <span className="material-icons text-4xl text-gray-400 group-hover:text-primary transition-colors">{step.icon}</span>
                    </div>
                  </div>
                  <div className="text-center px-4">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">{step.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed group-hover:text-gray-400">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Community Showcase Section */}
      <section className="py-24 bg-background-main border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12 border-b border-gray-800 pb-6">
            <div>
              <h2 className="text-3xl font-bold font-display text-white">社区节点精选</h2>
              <p className="text-gray-500 mt-2 font-mono text-sm">USER_GENERATED_CONTENT // TOP_RATED</p>
            </div>
            <Link href="/community" className="hidden md:flex items-center text-primary hover:text-white font-medium transition-colors">
              进入矩阵画廊 <ArrowForwardIcon className="ml-1 text-sm" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "星际行者 · 豆豆",
                rarity: "Rare",
                rarityColor: "purple",
                author: "@SarahLi",
                likes: "1.2k",
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAc22dPpz62gbqDGrLCVbxiZ6NNfXEJMqqJj90oXii2P8sFRgVIucOzJU8UY32UhkIGJ5cxUF2dACQmNx_g7ii_YqGxlyD0Op-JQTOeFM3owG-hFyQFJqnz2VczEhQruWI7fKCEIGpA2rQZBdG_CXVA7iY0cBQlNR3CZHaOpEnuROGQ45oo80snaqCCxcyJj_mup3ng0tDk37uYbaOcbM5VawUtKkH2H-mh9lMRsfwm-in8VJy2QSfbfKImUU8hP4R5vkFE4DjkLPw",
                avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDz4UPFabeR4m1LlzPIz-R2plUhLyfaV6VEpjGbIZq09IB77jAtA4BFgafzRnvcnrBxZRn2Yzq1YJ5VzpTHnFHGyDsi9kLfP_7vT7PCM-bmwYhuWZpnhtCzJDjX9oSjhqVLLKAOMHmT2RbjuBhphRPFUYLQaQ3yG-UjgNiBdXwrkRoylaCJsUYPl5yJmKqPYdunOPtBf14eY7XqhxLfvz9nluLgizWQH--Idhp44wbG53ZYl5bWoRTC4jV2X9YYo_tHIF4qaGSNVaA",
              },
              {
                name: "帝国元帅 · 咪咪",
                rarity: "Legendary",
                rarityColor: "orange",
                author: "@JasonW",
                likes: "856",
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAU3t89nyr8WUrIevEAnx2G1sTXLcpeHpcLmDBFtBVcjqqG8M-paPMHEZ5ILALVmwIRdlTeVDVM5GKC-Efo79zoB4x94xijo64MG2G2MPnYMK_QjLY-Pln76JU16aH_VKEBRpKXgWVOb9qmcLrDdbkC5xt8UwObz1LvP_ulKjAwxYSa7Mwou9fznjnsu9PoVgnTgfZooWRgxxdj0BA7_lwcZkUdvD_6tvF5gwyPovh3A0hfS0V_sWj2ru5205tbGVXkRujuH5JmKQ",
                avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAJgPiSIFkKHxT8uxeNN8kdjwhfxs1mPhGk-cSks8ey7JTHFI4JJKZjJ2oKkyywE03JhLAoDtQa6nuDD55vX_6N5UcIIGN_BhZ0Omfp8Ozg7kZlyKuo1K9TdpYmI831N6YXCSQu51LuaRHIyMgUnMgK5a6ue5VFL8eDvv4I0z0LDsBnykABEtwiF9xCuvQnj8eEbBI8wVLKba2JeM3wn600oeFxETPw6Hopwp9eFg8YfykebPQ8dI5_ylABBCcPJmWkcOSP2KeHU",
              },
              {
                name: "低多边形 · 橘子",
                rarity: "Epic",
                rarityColor: "blue",
                author: "@Chen_Design",
                likes: "2.1k",
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCtyDMQ4cciru7IRrifshnelL6m4N2V63pwaPyftQKopeq442Z8CK047joik51qA063jIamRJu1Fk2Zhi7w8K70Wr1kqnVj_Uy-rmpkxg5ElehyfH82QaRPBjU3daaBpjr7JHMHaIq5lvlwIqlHOtq0dB2_N6ugsBjeu6Emk1t2C3zbIFwBPyTvfmtNbqJ4bzkAqzIQmsHrrtJpeNgetYRSxGJZ0mH4WYCIgeGYyxV2RgSbizh8z35Pe3YMm5LAW0G_JWh3B7GzA",
                avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuB947T9M1KSOgA4BEOa31eCSIr7H_NsbD90834saLCQe5V0N0Gof0wiz_I5dA6Bkd-K1ft7hQCnw0Ef5Kfz3TkbQsP6R-ei2suentUGLXY7pXWkHxUbyp1FVTbGMS1H_ObxDPwNuOzjQh8KCFVuiw3wY6OTmb4UKLJII_HwUbIxWkXqqheYbJ0sWEZp9lVOVX2rkVODlMo_YwUnL5SA-Cbuhmx5GTIIB2DDXqmVAUDHMKboWLzDInUvUeA_JuWcm-Ikosqsc_dm9F8",
              },
            ].map((item, i) => (
              <div
                key={i}
                className={`group relative rounded-xl overflow-hidden bg-surface-card border border-gray-800 hover:border-${item.rarityColor}-500 transition-all duration-300 hover:shadow-neon`}
              >
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img
                    src={item.img}
                    alt={item.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-white text-lg tracking-wide">{item.name}</h3>
                    <span
                      className={`text-[10px] uppercase font-bold bg-${item.rarityColor}-900/50 text-${item.rarityColor}-300 border border-${item.rarityColor}-700/50 px-2 py-0.5 rounded backdrop-blur-sm`}
                    >
                      {item.rarity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800/50">
                    <div className="flex items-center gap-2">
                      <div className={`p-0.5 bg-gradient-to-tr from-${item.rarityColor === "purple" ? "primary" : item.rarityColor === "orange" ? "orange" : "blue"}-500 to-${item.rarityColor === "purple" ? "blue" : item.rarityColor === "orange" ? "yellow" : "cyan"}-400 rounded-full`}>
                        <img src={item.avatar} alt={item.author} className="w-6 h-6 rounded-full border border-black" />
                      </div>
                      <span className="text-xs text-gray-400 font-mono">{item.author}</span>
                    </div>
                    <div className="flex items-center text-gray-500 text-xs gap-3">
                      <span className="flex items-center gap-1 hover:text-red-500 transition-colors cursor-pointer">
                        <FavoriteIcon className="text-[14px]" /> {item.likes}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center md:hidden">
            <Link href="/community" className="inline-flex items-center text-primary hover:text-white font-medium">
              更多作品 <ArrowForwardIcon className="ml-1 text-sm" />
            </Link>
          </div>
        </div>
      </section>

      {/* Physical Products CTA */}
      <section className="py-24 bg-background-dark border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-surface-card to-[#120820] rounded-3xl overflow-hidden relative border border-gray-800 shadow-2xl">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />
            <div className="grid md:grid-cols-2 items-center">
              <div className="p-8 md:p-12 lg:p-16 relative z-10">
                <span className="text-orange-400 font-bold tracking-[0.2em] text-xs uppercase mb-4 block flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-400 rounded-full animate-ping" />
                  实体化协议
                </span>
                <h2 className="text-3xl lg:text-5xl font-bold font-display text-white mb-6">
                  把爱带进 <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">物理世界</span>
                </h2>
                <p className="text-lg text-gray-400 mb-8 font-light leading-relaxed">
                  先进的 3D 打印与制造工艺，将您生成的数字宠物转化为高精度的物理周边。从 UV 打印手机壳到光固化树脂手办，触手可及的科技温度。
                </p>
                <Link
                  href="/cart"
                  className="bg-white text-black hover:bg-gray-200 px-8 py-3 rounded-lg font-bold inline-flex items-center gap-2 transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                >
                  <ShoppingBagIcon />
                  探索周边商店
                </Link>
              </div>
              <div className="relative h-80 md:h-full min-h-[450px]">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKahf4SE_-SLGojmO-dzLhFYs2bm1AKfcDuhDOxCyjmYlkt3vqLjyjErF8HPJAK7__FrIdx68fUEMHKK7iWKoyhAeplxAn0wRYb7mrJC3QQKpNvbMoXzRfdSxzCCrasCoCmpDpvdBSjUq5BItjzEXsFwb6DgmYvlwRGkQ_j1bVQtotAw-t-EtMe5jAYM_L5VhA6uaSB9g4NYA_oGFUh5YOaoppmMvLT0ybl3PAV7hyC-NbHeh0cCX5priQRPRoHEGUtXRoK2FYcRo"
                  alt="Merchandise Preview"
                  className="absolute inset-0 w-full h-full object-cover md:rounded-l-3xl mix-blend-normal opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent md:bg-gradient-to-r md:from-surface-card md:via-surface-card/50 md:to-transparent" />
                <div className="absolute bottom-6 right-6 bg-black/70 backdrop-blur-md border border-gray-700 px-3 py-1.5 rounded text-xs text-white font-mono hidden md:block">
                  ITEM: RESIN_FIGURE_V2
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#030105] border-t border-gray-900 pt-16 pb-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <SmartToyIcon className="text-primary text-2xl" />
                <span className="font-display font-bold text-xl text-white">PetForge</span>
              </div>
              <p className="text-sm text-gray-500 mb-6 font-light">
                PetForge Network © 2023.<br />
                连接碳基生命与硅基灵魂的桥梁。
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6 uppercase text-sm tracking-wider">产品矩阵</h4>
              <ul className="space-y-3 text-sm text-gray-500">
                <li><Link href="#" className="hover:text-primary transition-colors">AI 创世引擎</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">3D 资产库</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">物理制造</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">企业级 API</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6 uppercase text-sm tracking-wider">开发者资源</h4>
              <ul className="space-y-3 text-sm text-gray-500">
                <li><Link href="#" className="hover:text-primary transition-colors">文档中心</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">社区画廊</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">技术博客</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">开源组件</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6 uppercase text-sm tracking-wider">关于</h4>
              <ul className="space-y-3 text-sm text-gray-500">
                <li><Link href="#" className="hover:text-primary transition-colors">未来愿景</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">加入飞船</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">联系信号</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">隐私协议</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-900/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-600 font-mono">© 2023 PetForge Inc. All systems operational.</p>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-xs text-gray-500 font-mono">SYSTEM_ONLINE</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
