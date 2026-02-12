"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SmartToyIcon,
  PersonIcon,
  EmailIcon,
  PhoneIcon,
  CameraIcon,
  SaveIcon,
  ArrowBackIcon,
  LockIcon,
} from "@/components/ui/icons";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

// Custom icons for the page
function ArrowBackIconCustom({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
    </svg>
  );
}

function PhoneIconCustom({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
    </svg>
  );
}

function SaveIconCustom({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z" />
    </svg>
  );
}

function CameraIconCustom({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
    </svg>
  );
}

function LockIconCustom({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z" />
    </svg>
  );
}

function WechatIconCustom({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.328.328 0 00.186-.059l2.114-1.225a.866.866 0 01.46-.126c.088 0 .175.012.26.035.996.27 2.058.42 3.162.42.267 0 .531-.013.792-.038-.174-.589-.267-1.204-.267-1.836 0-3.688 3.424-6.684 7.646-6.684.159 0 .317.006.474.015C17.092 4.425 13.282 2.188 8.691 2.188zm8.468 6.694c-4.038 0-7.326 2.836-7.326 6.328 0 3.492 3.288 6.328 7.326 6.328.807 0 1.583-.113 2.31-.32a.688.688 0 01.204-.029c.124 0 .244.033.354.103l1.625.944a.25.25 0 00.143.046.226.226 0 00.223-.228c0-.055-.022-.11-.037-.163l-.3-1.14a.453.453 0 01.164-.512c1.406-1.036 2.303-2.568 2.303-4.269 0-3.492-3.288-6.328-7.326-6.328zM6.997 7.37a1.09 1.09 0 110 2.18 1.09 1.09 0 010-2.18zm5.307 0a1.09 1.09 0 110 2.18 1.09 1.09 0 010-2.18zm4.832 4.334a.834.834 0 110 1.668.834.834 0 010-1.668zm3.668 0a.834.834 0 110 1.668.834.834 0 010-1.668z" />
    </svg>
  );
}

function AlipayIconCustom({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <path d="M21.422 15.358c-3.372-1.247-6.247-2.897-8.544-4.848.49-.98.923-2.016 1.282-3.098h-4.53v-1.17h5.41v-.975h-5.41V3.5H7.726c-.225 0-.405.18-.405.405v1.362H1.86v.975h5.46v1.17H2.88v.975h8.756c-.29.805-.636 1.572-1.03 2.298-2.193-1.752-4.816-3.138-7.798-3.993 2.982.855 5.605 2.24 7.798 3.993-1.446 2.52-3.59 4.598-6.393 5.892v.015c3.72-.945 6.945-2.805 9.39-5.28 2.247 1.8 4.98 3.33 8.115 4.44V15.358z" />
    </svg>
  );
}

function BioIconCustom({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
    </svg>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, initializeAuth, updateUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=" + encodeURIComponent("/account/profile"));
    } else if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone((user as any)?.phone || "");
      setBio((user as any)?.bio || "");
      setAvatar((user as any)?.avatar || "");
      setLoading(false);
    }
  }, [isAuthenticated, user, router]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    setUploading(true);
    setError("");

    try {
      // First preview the image locally
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to server
      const result = await api.uploadAvatar(file);

      if (result.success && result.data?.avatar) {
        setAvatar(result.data.avatar);
        // Update user in store
        if (user) {
          updateUser({ ...user, avatar: result.data.avatar } as any);
        }
      } else {
        setError(result.error || "Failed to upload avatar");
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setError("");
    setSuccess(false);

    if (!name.trim()) {
      setError("Nickname is required");
      return;
    }

    setSaving(true);
    try {
      const result = await api.updateProfile({
        name: name.trim(),
        phone: phone.trim() || undefined,
        bio: bio.trim() || undefined,
        avatar: avatar || undefined,
      });

      if (result.success) {
        setSuccess(true);
        // Update user in store
        if (user) {
          updateUser({
            ...user,
            name: name.trim(),
            avatar,
          } as any);
        }
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || "Failed to save profile");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setName(user.name || "");
      setPhone((user as any)?.phone || "");
      setBio((user as any)?.bio || "");
      setAvatar((user as any)?.avatar || "");
    }
    setError("");
    setSuccess(false);
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-tech-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Get user initials for avatar placeholder
  const getUserInitials = () => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-tech-dark font-display text-gray-200 selection:bg-primary selection:text-white antialiased">
      {/* Background Effects */}
      <div className="fixed inset-0 tech-grid opacity-20 pointer-events-none" />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 w-full border-b border-tech-border bg-tech-dark/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/20 ring-1 ring-white/10">
                <SmartToyIcon className="text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                PetAI <span className="text-primary text-glow">Creator</span>
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <Link
                href="/account"
                className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
              >
                Account Center
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition-colors"
        >
          <ArrowBackIconCustom />
          Back to Account
        </Link>

        {/* Profile Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Personal Settings</h1>
          <p className="text-gray-400">Manage your profile and account settings</p>
        </div>

        {/* Main Layout */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Avatar Section */}
          <div className="lg:col-span-1">
            <div className="bg-tech-card/50 backdrop-blur-sm rounded-xl border border-tech-border p-6 relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-[60px] pointer-events-none" />

              <h3 className="text-lg font-semibold text-white mb-6 relative z-10">Profile Picture</h3>

              {/* Avatar */}
              <div className="flex flex-col items-center relative z-10">
                <div
                  onClick={handleAvatarClick}
                  className="relative group cursor-pointer"
                >
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center ring-4 ring-primary/20 overflow-hidden transition-all group-hover:ring-primary/40">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt="Avatar"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-5xl font-bold text-white">{getUserInitials()}</span>
                    )}
                  </div>

                  {/* Upload overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploading ? (
                      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <CameraIconCustom className="text-white text-2xl" />
                    )}
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />

                <p className="mt-4 text-sm text-gray-400 text-center">
                  Click to change avatar
                </p>
                <p className="mt-1 text-xs text-gray-500 text-center">
                  Max 5MB, JPG/PNG
                </p>
              </div>
            </div>

            {/* Account Security Card */}
            <div className="bg-tech-card/50 backdrop-blur-sm rounded-xl border border-tech-border p-6 relative overflow-hidden mt-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <LockIconCustom className="text-primary" />
                Account Security
              </h3>

              <button
                onClick={() => router.push("/account/security")}
                className="w-full flex items-center justify-between p-3 bg-black/20 border border-white/10 rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-all group"
              >
                <span className="text-gray-300 group-hover:text-white transition-colors">
                  Change Password
                </span>
                <ArrowBackIconCustom className="rotate-180 text-gray-500 group-hover:text-primary transition-colors" />
              </button>
            </div>
          </div>

          {/* Right Column - Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-tech-card/50 backdrop-blur-sm rounded-xl border border-tech-border p-8 relative overflow-hidden">
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-600/20 rounded-full blur-[60px] pointer-events-none" />

              <h3 className="text-lg font-semibold text-white mb-6 relative z-10">Basic Information</h3>

              {/* Form Fields */}
              <div className="space-y-6 relative z-10">
                {/* Nickname Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nickname <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <PersonIcon className="text-gray-500 text-lg" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-primary focus:border-primary transition-all focus:shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                      placeholder="Enter your nickname"
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <EmailIcon className="text-gray-500 text-lg" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full pl-12 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-gray-500 placeholder-gray-600 cursor-not-allowed"
                      placeholder="Email address"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                {/* Phone Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <PhoneIconCustom className="text-gray-500 text-lg" />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-primary focus:border-primary transition-all focus:shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                      placeholder="Enter your phone number (optional)"
                    />
                  </div>
                </div>

                {/* Bio Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bio
                  </label>
                  <div className="relative">
                    <div className="absolute top-4 left-0 pl-4 pointer-events-none">
                      <BioIconCustom className="text-gray-500 text-lg" />
                    </div>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      className="w-full pl-12 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-primary focus:border-primary transition-all focus:shadow-[0_0_15px_rgba(168,85,247,0.2)] resize-none"
                      placeholder="Write something about yourself..."
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{bio.length}/200 characters</p>
                </div>

                {/* Success Message */}
                {success && (
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3 animate-fadeIn">
                    <svg className="text-green-400 text-xl" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-green-400 text-sm">Profile updated successfully</p>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 animate-fadeIn">
                    <svg className="text-red-400 text-xl" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`flex-1 relative overflow-hidden font-bold py-4 px-6 rounded-xl transform transition flex items-center justify-center gap-2 text-lg group ${
                      saving
                        ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-primary to-purple-600 hover:from-primary-dark hover:to-purple-700 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] hover:-translate-y-0.5 active:translate-y-0"
                    }`}
                  >
                    {saving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <SaveIconCustom className="text-xl" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-6 py-4 bg-black/30 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            {/* Account Binding Section */}
            <div className="bg-tech-card/50 backdrop-blur-sm rounded-xl border border-tech-border p-6 relative overflow-hidden mt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Account Binding</h3>

              <div className="space-y-3">
                {/* WeChat */}
                <div className="flex items-center justify-between p-4 bg-black/20 border border-white/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <WechatIconCustom className="text-green-400 text-xl" />
                    </div>
                    <div>
                      <p className="text-white font-medium">WeChat</p>
                      <p className="text-sm text-gray-500">Not connected</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/20 transition-colors">
                    Bind
                  </button>
                </div>

                {/* Alipay */}
                <div className="flex items-center justify-between p-4 bg-black/20 border border-white/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <AlipayIconCustom className="text-blue-400 text-xl" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Alipay</p>
                      <p className="text-sm text-gray-500">Not connected</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/20 transition-colors">
                    Bind
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                * Account binding features are for display purposes only
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
