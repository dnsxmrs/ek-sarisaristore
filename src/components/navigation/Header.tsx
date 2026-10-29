"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, ScanLine, PackageSearch, Receipt, NotebookPen, TrendingUp } from "lucide-react";

export function Header() {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Presyo",
      href: "/",
      icon: ScanLine,
      isActive: pathname === "/",
    },
    {
      name: "Tindahan",
      href: "/products",
      icon: PackageSearch,
      isActive: pathname === "/products" || (pathname.startsWith("/products/") && !pathname.includes("/new")),
    },
    {
      name: "Benta",
      href: "/sales",
      icon: Receipt,
      isActive: pathname === "/sales" || pathname.startsWith("/sales"),
    },
    {
      name: "Utang",
      href: "/utang",
      icon: NotebookPen,
      isActive: pathname === "/utang" || pathname.startsWith("/utang"),
    },
    {
      name: "Ulat",
      href: "/reports",
      icon: TrendingUp,
      isActive: pathname === "/reports" || pathname.startsWith("/reports") || pathname === "/dashboard",
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-teal-900 text-white shadow-md">
      <div className="max-w-md md:max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-heading font-semibold text-lg tracking-tight shrink-0">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-sm">
            <Store className="w-5 h-5 text-teal-950" />
          </div>
          <div className="flex flex-col">
            <span className="leading-tight text-white font-bold md:text-lg">Sari-Sari Store</span>
            <span className="text-[10px] md:text-xs text-teal-200 font-sans tracking-normal font-normal">
              Presyo & Produkto (Local LAN)
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                  item.isActive
                    ? "bg-teal-800 text-amber-300 font-semibold shadow-inner border border-teal-700/60"
                    : "text-teal-100 hover:text-white hover:bg-teal-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${item.isActive ? "text-amber-300" : "text-teal-200"}`} />
                <span className="whitespace-nowrap">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Status Pill */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-teal-800/80 px-2.5 py-1 rounded-full text-xs font-medium text-teal-100 border border-teal-700/60 whitespace-nowrap shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span className="whitespace-nowrap">Online (LAN)</span>
          </div>
        </div>
      </div>
    </header>
  );
}

