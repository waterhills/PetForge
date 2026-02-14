"use client";

import { User } from "@/types/admin";

interface FilterStatusProps {
  selectedUser: User | null;
  filteredCount: number;
  totalCount: number;
  onClear: () => void;
}

export default function FilterStatus({
  selectedUser,
  filteredCount,
  totalCount,
  onClear,
}: FilterStatusProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-tech-card/50 border border-tech-border rounded-lg mb-6">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400">
          Viewing:{" "}
          <span className="font-medium text-slate-200">
            {selectedUser ? (
              <>
                {selectedUser.name || selectedUser.email}
                <span className="text-slate-400">&apos;s PetIPs</span>
              </>
            ) : (
              <span className="text-primary">All Users</span>
            )}
          </span>
        </span>
        <span className="text-xs text-slate-500">
          ({filteredCount} of {totalCount})
        </span>
      </div>

      {(selectedUser || filteredCount !== totalCount) && (
        <button
          onClick={onClear}
          className="text-xs px-3 py-1.5 text-slate-400 hover:text-white hover:bg-red-500/20 border border-tech-border hover:border-red-500/50 rounded-lg transition-all"
        >
          Clear Filter
        </button>
      )}
    </div>
  );
}
