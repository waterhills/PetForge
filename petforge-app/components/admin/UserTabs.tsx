"use client";

interface UserTabsProps {
  activeTab: 'petips' | 'orders';
  onTabChange: (tab: 'petips' | 'orders') => void;
  petIPsCount: number;
  ordersCount: number;
}

export default function UserTabs({ activeTab, onTabChange, petIPsCount, ordersCount }: UserTabsProps) {
  return (
    <div className="mb-6 border-b border-gray-700">
      <nav className="flex gap-6">
        <button
          onClick={() => onTabChange('petips')}
          className={`pb-3 px-2 font-medium transition-colors ${
            activeTab === 'petips'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          宠物IP ({petIPsCount})
        </button>
        <button
          onClick={() => onTabChange('orders')}
          className={`pb-3 px-2 font-medium transition-colors ${
            activeTab === 'orders'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          订单 ({ordersCount})
        </button>
      </nav>
    </div>
  );
}
