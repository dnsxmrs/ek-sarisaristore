import Link from "next/link";
import { Store } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-30 bg-teal-900 text-white shadow-md">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-heading font-semibold text-lg tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-sm">
            <Store className="w-5 h-5 text-teal-950" />
          </div>
          <div className="flex flex-col">
            <span className="leading-tight text-white font-bold">Sari-Sari Store</span>
            <span className="text-[10px] text-teal-200 font-sans tracking-normal font-normal">
              Presyo & Produkto (Local LAN)
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-1.5 bg-teal-800/80 px-2.5 py-1 rounded-full text-xs font-medium text-teal-100 border border-teal-700/60">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Online (LAN)</span>
        </div>
      </div>
    </header>
  );
}
