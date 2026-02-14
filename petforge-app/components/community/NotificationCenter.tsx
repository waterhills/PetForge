"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/communityApi";
import type { Notification } from "@/types/community";

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotificationsData = async () => {
    try {
      const response = await fetchNotifications({ unreadOnly: true, limit: 50 });
      if (response.success && response.data) {
        setNotifications(response.data);
        setUnreadCount(response.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchNotificationsData();
    const interval = setInterval(fetchNotificationsData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle mark as read
  const handleMarkAsRead = async (
    notificationId: string,
    postId?: string
  ) => {
    try {
      await markNotificationRead(notificationId);
      // Update local state
      setNotifications((prev) =>
        prev.filter((n) => n.id !== notificationId)
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  // Get notification text
  const getNotificationText = (notification: Notification) => {
    const typeTexts = {
      like: "赞了你的动态",
      comment: "评论了你的动态",
      reply: "回复了你的评论",
      favorite: "收藏了你的动态",
    };

    const actorName = notification.post?.user?.name || notification.comment?.user?.name || "用户";
    return `${actorName} ${typeTexts[notification.type as keyof typeof typeTexts]}`;
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    const icons = {
      like: "♥",
      comment: "💬",
      reply: "↩️",
      favorite: "⭐",
    };
    return icons[type as keyof typeof icons] || "🔔";
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-white transition-colors"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.41-1.41L15 17zM5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z"
          />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-surface-card/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50 bg-gradient-to-r from-primary/10 to-transparent">
            <h3 className="font-semibold text-white">通知</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-primary hover:text-primary-glow transition-colors"
              >
                全部已读
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-4xl mb-3">🔔</div>
                <p className="text-slate-400">暂无新通知</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700/30">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`hover:bg-white/5 transition-colors ${
                      !notification.isRead ? "bg-primary/5" : ""
                    }`}
                  >
                    <Link
                      href={
                        notification.post
                          ? `/community/post/${notification.post.id}`
                          : "#"
                      }
                      onClick={() =>
                        handleMarkAsRead(notification.id, notification.postId)
                      }
                      className="block px-4 py-3"
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-200 line-clamp-2">
                            {getNotificationText(notification)}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(notification.createdAt).toLocaleString("zh-CN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-700/50">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="block text-center text-sm text-primary hover:text-primary-glow transition-colors"
              >
                查看全部通知
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
