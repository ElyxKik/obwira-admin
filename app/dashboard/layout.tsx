"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { 
  LayoutDashboard, 
  BedDouble, 
  LogOut, 
  Menu,
  X,
  ListTodo,
  Utensils,
  Wine,
  Sparkles,
  Presentation
} from "lucide-react";
import Link from "next/link";
import NotificationBell from "@/components/NotificationBell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/");
      } else {
        setUser(user);
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (!user) return null;

  const navItems = [
    { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
    { label: "Réservations", href: "/dashboard/reservations", icon: ListTodo },
    { label: "Chambres", href: "/dashboard/rooms", icon: BedDouble },
    { label: "Salles", href: "/dashboard/halls", icon: Presentation },
    { label: "Restaurant", href: "/dashboard/restaurant", icon: Utensils },
    { label: "Bar", href: "/dashboard/bar", icon: Wine },
    { label: "Expériences", href: "/dashboard/experiences", icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-primary-black text-white flex">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-secondary-black border-r border-white/10 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:relative lg:translate-x-0`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo_obwira.png" alt="Obwira Logo" className="w-8 h-8 rounded" />
              <span className="font-playfair font-bold text-lg">Obwira Admin</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive 
                      ? "bg-primary-gold text-black font-bold" 
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User & Logout */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <span className="font-bold text-xs">{user.email?.[0].toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{user.email}</p>
                <p className="text-xs text-gray-500">Administrateur</p>
              </div>
            </div>
            
            <button 
              onClick={() => auth.signOut()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden bg-secondary-black border-b border-white/10 p-4 flex items-center justify-between sticky top-0 z-40">
          <button onClick={() => setIsSidebarOpen(true)} className="text-white">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-playfair font-bold text-lg">Obwira Admin</span>
          <NotificationBell />
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex bg-secondary-black border-b border-white/10 p-6 justify-between items-center sticky top-0 z-40">
          <h2 className="font-playfair text-xl font-bold capitalize">
            {pathname === '/dashboard' ? 'Tableau de bord' : pathname.split('/').pop()?.replace('-', ' ')}
          </h2>
          <div className="flex items-center gap-4">
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
