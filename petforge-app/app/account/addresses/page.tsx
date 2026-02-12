"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SmartToyIcon,
  LocationOnIcon,
  AddIcon,
  EditIcon,
  DeleteIcon,
  CheckCircleIcon,
  CloseIcon,
} from "@/components/ui/icons";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

// Custom icons
function AddIconCustom({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  );
}

function EditIconCustom({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  );
}

function DeleteIconCustom({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  );
}

function CloseIconCustom({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  );
}

interface Address {
  id: string;
  receiverName: string;
  receiverPhone: string;
  province: string;
  city: string;
  district: string;
  detailAddress: string;
  isDefault: boolean;
}

const provinces = ["Beijing", "Shanghai", "Guangdong", "Zhejiang", "Jiangsu", "Sichuan", "Hubei", "Shandong"];
const cities: Record<string, string[]> = {
  "Beijing": ["Beijing"],
  "Shanghai": ["Shanghai"],
  "Guangdong": ["Guangzhou", "Shenzhen", "Dongguan", "Foshan"],
  "Zhejiang": ["Hangzhou", "Ningbo", "Wenzhou", "Jiaxing"],
  "Jiangsu": ["Nanjing", "Suzhou", "Wuxi", "Changzhou"],
  "Sichuan": ["Chengdu", "Mianyang", "Deyang"],
  "Hubei": ["Wuhan", "Yichang", "Xiangyang"],
  "Shandong": ["Jinan", "Qingdao", "Yantai", "Weifang"],
};

export default function AddressesPage() {
  const router = useRouter();
  const { isAuthenticated, initializeAuth } = useAuthStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    receiverName: "",
    receiverPhone: "",
    province: "",
    city: "",
    district: "",
    detailAddress: "",
    isDefault: false,
  });

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=" + encodeURIComponent("/account/addresses"));
    } else {
      loadAddresses();
    }
  }, [isAuthenticated, router]);

  const loadAddresses = async () => {
    try {
      const result = await api.getAddresses();
      if (result.success) {
        setAddresses(result.data);
      }
    } catch (err) {
      console.error("Failed to load addresses:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      receiverName: "",
      receiverPhone: "",
      province: "",
      city: "",
      district: "",
      detailAddress: "",
      isDefault: false,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (address: Address) => {
    setFormData({
      receiverName: address.receiverName,
      receiverPhone: address.receiverPhone,
      province: address.province,
      city: address.city,
      district: address.district,
      detailAddress: address.detailAddress,
      isDefault: address.isDefault,
    });
    setEditingId(address.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingId) {
        const result = await api.updateAddress(editingId, formData);
        if (result.success) {
          setAddresses(addresses.map(a => a.id === editingId ? { ...a, ...formData } : a));
          if (formData.isDefault) {
            setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === editingId })));
          }
          resetForm();
        }
      } else {
        const result = await api.addAddress(formData);
        if (result.success) {
          const newAddress = { ...formData, id: result.data.id };
          if (formData.isDefault) {
            setAddresses(prev => [...prev.map(a => ({ ...a, isDefault: false })), newAddress]);
          } else {
            setAddresses(prev => [...prev, newAddress]);
          }
          resetForm();
        }
      }
    } catch (err) {
      console.error("Failed to save address:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const result = await api.deleteAddress(id);
      if (result.success) {
        setAddresses(addresses.filter(a => a.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete address:", err);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const result = await api.setDefaultAddress(id);
      if (result.success) {
        setAddresses(addresses.map(a => ({ ...a, isDefault: a.id === id })));
      }
    } catch (err) {
      console.error("Failed to set default address:", err);
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-tech-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tech-dark font-display text-gray-200 selection:bg-primary selection:text-white antialiased">
      {/* Background Effects */}
      <div className="fixed inset-0 tech-grid opacity-20 pointer-events-none" />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

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
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <LocationOnIcon className="text-primary" />
              Shipping Addresses
            </h1>
            <p className="text-gray-400 mt-2">Manage your delivery addresses</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-colors"
          >
            <AddIconCustom />
            Add Address
          </button>
        </div>

        {/* Address Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-tech-card rounded-2xl border border-tech-border p-6 w-full max-w-lg relative">
              <button
                onClick={resetForm}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <CloseIconCustom className="text-xl" />
              </button>

              <h2 className="text-xl font-bold text-white mb-6">
                {editingId ? "Edit Address" : "Add New Address"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.receiverName}
                      onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })}
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      placeholder="Recipient name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Phone <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.receiverPhone}
                      onChange={(e) => setFormData({ ...formData, receiverPhone: e.target.value })}
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      placeholder="Phone number"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Province</label>
                    <select
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value, city: "" })}
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    >
                      <option value="">Select</option>
                      {provinces.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                    <select
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      disabled={!formData.province}
                    >
                      <option value="">Select</option>
                      {formData.province && cities[formData.province]?.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">District</label>
                    <input
                      type="text"
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      placeholder="District"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Detail Address <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={formData.detailAddress}
                    onChange={(e) => setFormData({ ...formData, detailAddress: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none"
                    placeholder="Street address, building, unit number..."
                    required
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-600 bg-black/30 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-300">Set as default address</span>
                </label>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Address"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Address List */}
        {addresses.length === 0 ? (
          <div className="bg-tech-card/50 backdrop-blur-sm rounded-xl border border-tech-border p-12 text-center">
            <LocationOnIcon className="mx-auto text-6xl text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg mb-4">No addresses yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-block px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-colors"
            >
              Add Your First Address
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`bg-tech-card/50 backdrop-blur-sm rounded-xl border p-6 transition-all ${
                  address.isDefault ? "border-primary/50 shadow-[0_0_20px_rgba(139,92,246,0.1)]" : "border-tech-border hover:border-white/20"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-white">{address.receiverName}</span>
                      <span className="text-gray-400">{address.receiverPhone}</span>
                      {address.isDefault && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      {address.province} {address.city} {address.district} {address.detailAddress}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-lg transition-colors"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(address)}
                      className="p-2 text-gray-400 hover:text-primary hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <EditIconCustom />
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <DeleteIconCustom />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
