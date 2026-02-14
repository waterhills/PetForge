"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  SmartToyIcon,
  AddAPhotoIcon,
  MovieFilterIcon,
  PaletteIcon,
  BoltIcon,
  GestureIcon,
  AutoAwesomeIcon,
  ArrowForwardIcon,
  ThreeDRotationIcon,
  RefreshIcon,
} from "@/components/ui/icons";
import api from "@/lib/api";
import Navigation from "@/components/layout/Navigation";

// 风格选项
const STYLES = [
  {
    id: "pixar",
    name: "皮克斯 3D",
    description: "生动活泼的主角光环，细节丰富，质感细腻。",
    icon: MovieFilterIcon,
    color: "purple",
  },
  {
    id: "clay",
    name: "粘土世界",
    description: "软糯可爱的定格动画风格，充满手工温度。",
    icon: PaletteIcon,
    color: "orange",
  },
  {
    id: "cyber",
    name: "赛博萌宠",
    description: "霓虹光效与机械质感的未来派结合。",
    icon: BoltIcon,
    color: "blue",
    preview: "https://lh3.googleusercontent.com/aida-public/AB6AXuDRh308zlJaHuXA8Uq64LC_rcZ-rfnxBqoKqCgzT3tZ9euRmUR6JRabWcdrGRlEhuLZ6zBGYEdYMN0-4NP2sGam5IeOhs1v-7zIqrjcmiShNpXUNxqU-Q0lVukatoUUAYwOWvjwLkKkWvlrOKiwCpBVFetshlgfzTMG1rCz3fOXOxVj3WoeUC_DBCdpSj8RMBXtB2JwfU7myR_Jflf5mIguQXkDhIg3jfFIvxGOyVGP_GVgb-JklPRqHrV6n8CB9NMcVrfF2XVpN2Q",
  },
  {
    id: "line",
    name: "极简线条",
    description: "高雅的艺术线条，适合印制 T 恤和帆布袋。",
    icon: GestureIcon,
    color: "gray",
    preview: "https://lh3.googleusercontent.com/aida-public/AB6AXuA9BAmu55ppPMoqZqsdKsTvSGpMAO4yFRAORLZN2q_YB_sTJaQKxl4ahkCYVmPvFkYb6VD8EgnnQqm9JHrliVS0pBxcTLxbuiEq9nfEpwcx-mMLIAx3f4c0816hvTgGRi50kRDvp4wWTO5h7FINB4D4AteJ9W7_AgcFd1lkk0TWMkEIvFZDxWd0pjpZX3p2NA4Auu_2JKik11kyTzHd3dBlfjbuG7z7uqyqZr-23_GtCxYA-y1JMl_gwH8j-RcLJKcsweZ2WVlhPdM",
  },
];

// 示例照片
const EXAMPLE_PHOTOS = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCvwZiCRLxTyJfIrv41rOypCgnatpumg9V9LRAv66iUd7RfeLPBmPatuYEJ_rL2kKVak1EdY9c9BdZXZsqkk5NofCE0476VIRlhLwcYnpkw7O2q9xlNXpm2kKDp1rhTJvqKyEG_czdZSfNBTOtvAfwwbpO86MGBupAq1Uf5mVHPwElDDhJ6HymyILK_RgfJx0GOfVHpSJlB8ZkQdR0EHhdLDDSRAQ7IZ6c4J7miOI6AbzSkBrt0lc2uXHZDDtZVtxvioyE8KOqRDM",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAWvWrTPk4xwYt984PNfNMHCGPSbpFNAQC1S9Qh9PzDRrr6a6OzhVgdearnRzfSZHL-DM_duXx2q9BxC803RWS9UNuZkBAEjvsp2kybaBaF6lgb1nvshODgJPElk_0zg7nRSiD2tm5mAzEmJ1l37xqFYj8YIgqc_c2mq-lKhm5W38QyPtOuPoTFNGyA70erQSwoVM8KKemxSVDGfeMxpp1-idSdnazZ0PGqtyHn9KRBOOmAIbcUdRdYcrN90nQKFwt5tr80e9ae3o",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAm6-K-Vu2lJILEOwOKlirqqQe7zslmTFpPBkmHfvOTRqkrbVqeSE8VDJANKl8nhvCssIHH8bwaJn9A7tScV8XdSwgtXiNMUfkAZvw9zuLaaOyecS-GHslAm7FP7IRk9UyAtcfIKfYEMRbKwFLZgWw7rdZ4d2lTHJb_iSWaSg4Tbb4xCX22nvFN1pmiC6GK-2hamVVc3Vv5sgWjV_8o32BzgwkH3DYs5NtS8-En6MWqT3ricRQTDK3tvcNlyMg2ihc9zdF2_In9v5w",
];

// 生成类型选项
const GENERATION_TYPES = [
  {
    id: "image",
    name: "2D 图像",
    description: "快速生成2D图像",
    cost: 5,
    icon: "🖼️",
  },
  {
    id: "3d",
    name: "3D 模型",
    description: "生成完整3D模型（GLB格式）",
    cost: 10,
    icon: "🎲",
  },
];

export default function UploadPage() {
  const router = useRouter();

  // 状态管理
  const [selectedStyle, setSelectedStyle] = useState("pixar");
  const [selectedType, setSelectedType] = useState<"image" | "3d">("image");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  // 从localStorage恢复petName，防止页面刷新时丢失
  const [petName, setPetName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('petforge_pet_name') || '';
    }
    return '';
  });
  const [customPrompt, setCustomPrompt] = useState("");

  // 生成状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<{
    status: 'idle' | 'queued' | 'processing' | 'completed' | 'failed';
    progress: number;
    taskId: string | null;
    result: any;
  }>({
    status: 'idle',
    progress: 0,
    taskId: null,
    result: null,
  });

  const [pollInterval, setPollInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  // 文件选择处理
  const handleFileSelect = useCallback((file: File) => {
    if (file && file.size <= 10 * 1024 * 1024) {
      setUploadedFile(file);

      // 释放旧的 Blob URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setOriginalImageUrl(null); // 重置上传后的图片URL
      // 重置生成状态
      setGenerationStatus({
        status: 'idle',
        progress: 0,
        taskId: null,
        result: null,
      });
    } else {
      alert("文件大小不能超过 10MB");
    }
  }, [previewUrl]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // 上传原始图片到服务器
  const uploadOriginalImage = useCallback(async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Get token from localStorage directly
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/upload-image`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!response.ok) {
        console.error('Upload failed:', response.statusText);
        return null;
      }

      const result = await response.json();
      return result.success ? result.imageUrl : null;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  }, []);

  // 轮询生成状态
  const pollGenerationStatus = useCallback(async (taskId: string) => {
    try {
      const response = await api.checkGenerationStatus(taskId);

      if (response.success) {
        const { data } = response;

        // 根据ComfyUI状态映射
        let status: 'idle' | 'queued' | 'processing' | 'completed' | 'failed' = 'idle';
        let progress = 0;

        if (data.status === 'pending') {
          status = 'queued';
          progress = 0;
        } else if (data.status === 'processing') {
          status = 'processing';
          progress = data.progress || 50;
        } else if (data.status === 'completed') {
          status = 'completed';
          progress = 100;
        } else if (data.status === 'failed') {
          status = 'failed';
          progress = 0;
        }

        // 生成完成且有结果URL时，直接跳转，不更新为completed状态（避免完成弹窗短暂闪烁）
        if (status === 'completed' && data.resultUrl) {
          if (pollInterval) {
            clearInterval(pollInterval);
            setPollInterval(null);
          }
          setIsGenerating(false);
          await handleCreatePetIPAndNavigate(data.resultUrl);
          return;
        }

        setGenerationStatus({
          status,
          progress,
          taskId,
          result: data,
        });

        // 失败或无resultUrl的完成，停止轮询
        if (status === 'completed' || status === 'failed') {
          if (pollInterval) {
            clearInterval(pollInterval);
            setPollInterval(null);
          }
          setIsGenerating(false);
        }
      }
    } catch (error) {
      console.error('Polling error:', error);
      setGenerationStatus({
        status: 'failed',
        progress: 0,
        taskId,
        result: null,
      });
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }
      setIsGenerating(false);
    }
  }, [pollInterval]);

  // 开始生成
  const handleGenerate = async () => {
    if (!uploadedFile) {
      alert("请先上传宠物照片");
      return;
    }

    if (!petName.trim()) {
      alert("请输入宠物名称");
      return;
    }

    setIsGenerating(true);
    setGenerationStatus({
      status: 'queued',
      progress: 0,
      taskId: null,
      result: null,
    });

    try {
      // 先上传原始图片获取服务器URL
      let uploadedImageUrl = originalImageUrl;
      if (!uploadedImageUrl) {
        uploadedImageUrl = await uploadOriginalImage(uploadedFile);
        if (!uploadedImageUrl) {
          throw new Error('上传原始图片失败，请重试');
        }
        setOriginalImageUrl(uploadedImageUrl);
      }

      // 读取文件为base64用于ComfyUI处理
      const reader = new FileReader();
      const fileBase64 = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(uploadedFile);
      });

      // 调用生成API
      const response = await api.queueGeneration({
        type: selectedType,
        style: selectedStyle,
        petName: petName.trim(),
        customPrompt: customPrompt.trim() || undefined,
        inputImage: fileBase64,
      });

      if (response.success) {
        const taskId = response.data.taskId;

        setGenerationStatus({
          status: 'queued',
          progress: 0,
          taskId,
          result: null,
        });

        // 开始轮询（每2秒检查一次）
        const interval = setInterval(() => {
          pollGenerationStatus(taskId);
        }, 2000);
        setPollInterval(interval);
      } else {
        throw new Error(response.error || '生成请求失败');
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      alert('生成失败：' + (error.message || '未知错误'));
      setGenerationStatus({
        status: 'failed',
        progress: 0,
        taskId: null,
        result: null,
      });
      setIsGenerating(false);
    }
  };

  // 重新生成
  const handleRegenerate = () => {
    setGenerationStatus({
      status: 'idle',
      progress: 0,
      taskId: null,
      result: null,
    });
  };


  // 创建PetIP并跳转到展示页面
  const handleCreatePetIPAndNavigate = async (resultImageUrl: string) => {
    // 再次验证宠物名称
    const trimmedName = petName.trim();
    if (!trimmedName) {
      alert('请先输入宠物名称');
      setIsGenerating(false);
      return;
    }

    try {
      // 根据风格设置稀有度
      const rarityMap: Record<string, string> = {
        'pixar': 'Epic',
        'clay': 'Rare',
        'cyber': 'Legendary',
        'line': 'Common',
      };

      const response = await api.createPetIP({
        name: trimmedName,
        style: selectedStyle,
        originalImage: originalImageUrl || undefined, // 使用服务器URL而不是blob URL
        generatedImage: resultImageUrl,
        rarity: rarityMap[selectedStyle] || 'Common',
      });

      if (response.success && response.data) {
        // 跳转到展示页面
        router.push(`/showcase?petId=${response.data.id}`);
      } else {
        console.error('Failed to create PetIP:', response.error);
        alert('创建资产失败，请重试');
      }
    } catch (error) {
      console.error('Create PetIP error:', error);
      alert('创建资产失败：' + (error as Error).message);
    }
  };

  // 清理轮询定时器
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  // 保存petName到localStorage，防止页面刷新时丢失
  useEffect(() => {
    if (typeof window !== 'undefined' && petName.trim()) {
      localStorage.setItem('petforge_pet_name', petName.trim());
    }
  }, [petName]);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden text-slate-200">
      {/* Fixed Tech Grid Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20 bg-[size:24px_24px] bg-tech-grid" />

      {/* Navigation */}
      <Navigation />

      {/* Progress Steps Bar */}
      <div className="w-full py-5 px-6 lg:px-10 flex justify-center items-center z-20 relative glass-nav">
        <div className="hidden md:flex items-center gap-2 bg-[#1c1c21] px-6 py-2.5 rounded-full border border-white/5 shadow-inner">
          <div className="flex items-center gap-2 text-primary font-medium">
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center text-xs shadow-[0_0_10px_rgba(168,85,247,0.3)]">
              1
            </div>
            <span className="text-sm">上传照片</span>
          </div>
          <div className="w-8 h-[1px] bg-white/10"></div>
          <div className={`flex items-center gap-2 font-medium ${generationStatus.status === 'idle' ? 'text-gray-500' : 'text-primary'}`}>
            <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${generationStatus.status !== 'idle' ? 'bg-primary/20 text-primary border-primary' : 'border-white/10 bg-white/5 text-gray-400'}`}>
              2
            </div>
            <span className="text-sm">生成预览</span>
          </div>
          <div className="w-8 h-[1px] bg-white/10"></div>
          <div className={`flex items-center gap-2 font-medium ${generationStatus.status === 'completed' ? 'text-primary' : 'text-gray-500'}`}>
            <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${generationStatus.status === 'completed' ? 'bg-primary/20 text-primary border-primary' : 'border-white/10 bg-white/5 text-gray-400'}`}>
              3
            </div>
            <span className="text-sm">定制周边</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow flex flex-col lg:flex-row gap-6 px-4 lg:px-10 pb-8 pt-6 max-w-[1800px] mx-auto w-full h-full relative z-10">
        {/* Left Column - Upload Area (7/12) */}
        <div className="w-full lg:w-7/12 flex flex-col h-full lg:min-h-[600px]">
          <div className="mb-6 pl-2">
            <h1 className="text-3xl lg:text-5xl font-bold mb-3 gradient-text tracking-tight">定制你的爱宠 IP</h1>
            <p className="text-gray-400 text-lg font-light tracking-wide">上传照片，AI 引擎一键生成独一无二的赛博 3D 形象</p>
          </div>

          {/* Upload Zone */}
          <div className="flex-grow relative group upload-zone cursor-pointer transition-all duration-300 rounded-2xl bg-[#131316]">
            <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl group-hover:bg-primary/10 transition-colors duration-500"></div>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              className="hidden"
              disabled={isGenerating}
            />
            <label
              htmlFor="file-upload"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative flex flex-col items-center justify-center w-full h-full min-h-[450px] rounded-2xl upload-zone-border transition-all duration-300 p-8 text-center overflow-hidden ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-neon-blue/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>
              <div className="relative z-10 flex flex-col items-center">
                {previewUrl ? (
                  <>
                    <div className="w-48 h-48 rounded-2xl overflow-hidden border-2 border-primary/50 shadow-[0_0_30px_rgba(168,85,247,0.4)] mb-6">
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-white">已选择照片</h3>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setPreviewUrl(null);
                        setUploadedFile(null);
                      }}
                      className="mt-4 px-6 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-full border border-primary/30 transition-all"
                      disabled={isGenerating}
                    >
                      重新选择
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-28 h-28 rounded-full bg-[#1c1c21] border border-white/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] group-hover:border-primary/50 transition-all duration-300 shadow-2xl">
                      <AddAPhotoIcon className="w-16 h-16 text-gray-400 group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-primary-300 transition-colors tracking-wide">点击上传爱宠照片</h3>
                    <p className="text-gray-500 mb-8 max-w-md group-hover:text-gray-400 transition-colors">支持 JPG, PNG 格式。为了 AI 最佳识别效果，请确保光线充足，五官清晰可见。</p>
                    <div className="flex items-center gap-4">
                      <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs text-gray-500 flex items-center gap-1 group-hover:bg-primary/10 group-hover:text-primary-200 group-hover:border-primary/20 transition-all">
                        <span className="text-sm">📎</span> 最大 10MB
                      </div>
                      <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs text-gray-500 flex items-center gap-1 group-hover:bg-primary/10 group-hover:text-primary-200 group-hover:border-primary/20 transition-all">
                        <span className="text-sm">✨</span> 自动抠图
                      </div>
                    </div>
                  </>
                )}
              </div>
            </label>
          </div>

          {/* Pet Name Input */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-300 mb-2 pl-2">
              宠物名称 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              placeholder="给你的宠物起个名字"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              disabled={isGenerating}
            />
          </div>

          {/* Generation Type Selection */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-300 mb-3 pl-2">
              生成类型
            </label>
            <div className="grid grid-cols-2 gap-3">
              {GENERATION_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id as any)}
                  className={`relative p-4 rounded-xl border-2 transition-all ${selectedType === type.id
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/50'
                    : 'border-white/10 bg-white/5 hover:border-primary/30'
                    }`}
                  disabled={isGenerating}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">{type.icon}</div>
                    <div className="text-sm font-medium text-gray-200">{type.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{type.description}</div>
                    <div className="text-xs text-primary mt-2 font-mono">
                      {type.cost} 积分
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Example Photos */}
          <div className="mt-6 flex gap-4 overflow-x-auto pb-4 items-center pl-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap self-center mr-2">优秀示例</div>
            <div className="flex gap-3">
              {EXAMPLE_PHOTOS.map((photo, index) => (
                <div key={index} className="group/img relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all cursor-pointer">
                  <img alt={`Example ${index + 1}`} src={photo} className="w-full h-full object-cover opacity-70 group-hover/img:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Style Selection (5/12) */}
        <div className="w-full lg:w-5/12 flex flex-col">
          <div className="bg-surface-card rounded-2xl p-6 lg:p-8 h-full border border-white/5 shadow-2xl relative overflow-hidden flex flex-col">
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-primary/5 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="absolute top-1/2 -left-20 w-40 h-40 bg-blue-600/5 rounded-full blur-[60px] pointer-events-none"></div>

            <div className="flex justify-between items-end mb-6 relative z-10">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">选择生成风格</h2>
                <p className="text-xs text-gray-500 mt-1">选择一种 AI 艺术风格以开始转换</p>
              </div>
              <button className="text-xs text-primary hover:text-white font-medium cursor-pointer transition-colors border border-primary/20 hover:border-primary/50 hover:bg-primary/10 rounded-full px-3 py-1">
                全部风格
              </button>
            </div>

            {/* Style Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10 flex-grow overflow-y-auto pr-2">
              {STYLES.map((style) => (
                <div key={style.id} className="group relative cursor-pointer style-card-hover transition-all duration-300">
                  <input
                    checked={selectedStyle === style.id}
                    onChange={() => !isGenerating && setSelectedStyle(style.id)}
                    className="peer hidden"
                    id={`style-${style.id}`}
                    name="style"
                    type="radio"
                    disabled={isGenerating}
                  />
                  <label
                    htmlFor={`style-${style.id}`}
                    className="block bg-[#222226] border border-white/5 rounded-xl overflow-hidden transition-all duration-300 peer-checked:border-primary peer-checked:ring-1 peer-checked:ring-primary peer-checked:shadow-[0_0_20px_rgba(168,85,247,0.2)] h-full cursor-pointer"
                  >
                    <div className="h-32 w-full bg-gray-900 relative overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-t from-[#222226] via-transparent to-transparent z-10"></div>
                      <style.icon className={`w-20 h-20 text-${style.color}-400 opacity-50 group-hover:opacity-100 transition-opacity duration-300`} />
                      <div className="absolute top-3 right-3 z-20 opacity-0 peer-checked:opacity-100 transition-opacity">
                        <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/40">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 relative">
                      <div className="absolute -top-4 left-3 bg-[#222226] p-1 rounded-lg border border-white/5 z-20">
                        <style.icon className={`w-5 h-5 text-${style.color}-400`} />
                      </div>
                      <h3 className="font-bold text-white mt-2 group-hover:text-primary transition-colors">{style.name}</h3>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{style.description}</p>
                    </div>
                  </label>
                </div>
              ))}
            </div>

            {/* Generate Button Section */}
            <div className="mt-6 pt-6 border-t border-white/5 z-20">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !uploadedFile}
                className={`w-full bg-gradient-to-r from-primary-dark to-primary hover:from-primary hover:to-primary-light text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(140,43,238,0.3)] hover:shadow-[0_0_35px_rgba(140,43,238,0.5)] transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 text-lg border border-white/10 group ${isGenerating || !uploadedFile ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>生成中...</span>
                  </>
                ) : (
                  <>
                    <span className="material-icons-round animate-pulse">auto_awesome</span>
                    <span className="tracking-widest">开始生成</span>
                    <ArrowForwardIcon className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </>
                )}
              </button>
              <div className="flex justify-between items-center mt-3 px-1">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className="text-primary text-sm">🪙</span> 消耗 {selectedType === '3d' ? 10 : 5} 点数
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className="text-sm">⏱️</span> 预计 15 秒
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Generation Status Modal */}
      {(generationStatus.status === 'queued' || generationStatus.status === 'processing' || generationStatus.status === 'completed' || generationStatus.status === 'failed') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface-card border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden">
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>

            {(generationStatus.status === 'queued' || generationStatus.status === 'processing') && (
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-32 h-32 relative mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                  <div
                    className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
                    style={{ animationDuration: '1s' }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">{Math.round(generationStatus.progress)}%</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {generationStatus.status === 'queued' ? '排队中...' : 'AI 生成中...'}
                </h3>
                <p className="text-sm text-gray-400 text-center">
                  {generationStatus.status === 'queued'
                    ? '您的任务已加入队列，请稍候...'
                    : '正在使用 ComfyUI 引擎生成您的专属宠物 IP，这可能需要 15-30 秒...'}
                </p>
              </div>
            )}


            {generationStatus.status === 'failed' && (
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">生成失败</h3>
                <p className="text-sm text-red-300 mb-6">
                  {generationStatus.result?.errorMessage || '未知错误，请重试'}
                </p>
                <button
                  onClick={handleRegenerate}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-100 text-gray-900 rounded-xl font-medium transition-all"
                >
                  <RefreshIcon className="w-5 h-5" />
                  <span>重试</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style jsx>{`
        .upload-zone-border {
          background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='16' ry='16' stroke='%23A855F7FF' stroke-width='2' stroke-dasharray='12%2c 12' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e");
          transition: all 0.3s ease;
        }
        .upload-zone:hover .upload-zone-border {
          background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='16' ry='16' stroke='%23D946EFFF' stroke-width='3' stroke-dasharray='12%2c 12' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e");
          box-shadow: 0 0 25px rgba(217, 70, 239, 0.2), inset 0 0 20px rgba(217, 70, 239, 0.1);
        }
        .style-card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 40px -10px rgba(168, 85, 247, 0.4);
          border-color: rgba(168, 85, 247, 0.5);
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6) infinite;
        }
      `}</style>
    </div>
  );
}
