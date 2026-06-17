"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, ShoppingBag, AlertTriangle, MessageSquare, User, Waves, Anchor } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/map", label: "Map", icon: Map },
  { href: "/alerts", label: "Alerts", icon: AlertTriangle },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/profile", label: "Profile", icon: User },
];

const waterNav = [
  { href: "/feed?category=water_conditions", label: "Water Conditions", icon: Waves },
  { href: "/feed?category=safety", label: "Safety", icon: AlertTriangle },
  { href: "/marketplace?type=dock", label: "Dock Exchange", icon: Anchor },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 space-y-6">
      <nav className="bg-white rounded-xl border border-gray-200 p-2 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === href
                ? "bg-water-50 text-water-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="bg-white rounded-xl border border-gray-200 p-2 space-y-0.5">
        <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Waterfront</p>
        {waterNav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
