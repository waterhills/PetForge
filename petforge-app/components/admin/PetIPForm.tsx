"use client";

import { useState, useEffect } from "react";

interface PetIPFormProps {
  onSubmit: (data: any) => void;
  initialData?: {
    name: string;
    style: string;
    rarity: string;
  };
  submitLabel?: string;
}

export default function PetIPForm({ onSubmit, initialData, submitLabel = "保存" }: PetIPFormProps) {
  const [formData, setFormData] = useState(
    initialData || {
      name: '',
      style: 'pixar',
      rarity: 'Common',
    }
  );

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          名称
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
          required
        />
      </div>

      {/* Style */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          风格
        </label>
        <input
          type="text"
          value={formData.style}
          onChange={(e) => setFormData({ ...formData, style: e.target.value })}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
          required
        />
      </div>

      {/* Rarity */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          稀有度
        </label>
        <select
          value={formData.rarity}
          onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
          required
        >
          <option value="Common">普通</option>
          <option value="Rare">稀有</option>
          <option value="Epic">史诗</option>
          <option value="Legendary">传说</option>
        </select>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
      >
        {submitLabel}
      </button>
    </form>
  );
}
