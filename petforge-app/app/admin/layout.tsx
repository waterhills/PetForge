"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-gray-800 border-r border-gray-700 z-50">
        <div className="p-6">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold">
              A
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">管理后台</h1>
              <p className="text-xs text-gray-400">PetForge Admin</p>
            </div>
          </Link>
        </div>

        <nav className="mt-6 px-4">
          <ul className="space-y-2">
            <li>
              <NavLink href="/admin" icon="📊">仪表盘</NavLink>
            </li>
            <li>
              <NavLink href="/admin/users" icon="👥">用户管理</NavLink>
            </li>
            <li>
              <NavLink href="/admin/roles" icon="🔑">角色权限</NavLink>
            </li>
            <li>
              <NavLink href="/admin/petips" icon="🐾">宠物IP管理</NavLink>
            </li>
            <li>
              <NavLink href="/admin/orders" icon="📦">订单管理</NavLink>
            </li>
          </ul>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <span>←</span>
            <span>返回前台</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/admin" && pathname?.startsWith(href));

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        isActive
          ? "bg-purple-600 text-white"
          : "text-gray-300 hover:bg-gray-700 hover:text-white"
      }`}
    >
      <span>{icon}</span>
      <span className="font-medium">{children}</span>
    </Link>
  );
}
