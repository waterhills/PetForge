"use client";

import { User } from "@/types/admin";

interface UserFilterProps {
  users: User[];
  selectedUserId: string | null;
  onUserSelect: (userId: string | null) => void;
  loading: boolean;
}

export default function UserFilter({
  users,
  selectedUserId,
  onUserSelect,
  loading,
}: UserFilterProps) {
  return (
    <div className="relative">
      <select
        value={selectedUserId || ""}
        onChange={(e) => onUserSelect(e.target.value || null)}
        disabled={loading}
        className="w-full px-4 py-2.5 bg-tech-card border border-tech-border rounded-lg text-slate-200 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all cursor-pointer hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">All Users</option>
        {users.map((user) => (
          <option key={user.id} value={user.id} className="py-2">
            {user.name || user.email} ({user._count.petIPs} PetIP{user._count.petIPs !== 1 ? "s" : ""})
          </option>
        ))}
      </select>

      {selectedUserId && (
        <button
          onClick={() => onUserSelect(null)}
          className="absolute right-3 top-1/2 text-slate-400 hover:text-white transition-colors p-1"
          aria-label="Clear user selection"
          title="Clear selection"
        >
          ✕
        </button>
      )}
    </div>
  );
}
