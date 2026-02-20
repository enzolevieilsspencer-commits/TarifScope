"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  History,
  Bell,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Hotel,
  Settings,
} from "lucide-react";
import { useSidebar } from "./sidebar-context";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, toggle } = useSidebar();

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      toast.success("Déconnexion réussie");
      // Force un refresh complet pour nettoyer les cookies
      window.location.href = "/login";
    } catch (error) {
      toast.error("Erreur lors de la déconnexion");
    }
  };

  const isActive = (path: string) => {
    if (path === "/app") {
      return pathname === "/app";
    }
    return pathname?.startsWith(path);
  };

  return (
    <aside className={`${isOpen ? "w-56" : "w-20"} border-r bg-card hidden md:block flex flex-col h-screen fixed left-0 top-0 z-10 transition-all duration-300`}>
      <div className="p-4 flex-1 overflow-y-auto">
        <div className={`mb-8 ${!isOpen ? "flex justify-center" : ""}`}>
          <div className={`flex items-center ${isOpen ? "gap-3" : "justify-center"} mb-1`}>
            <div className="h-12 w-12 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
              <Hotel className="h-6 w-6 text-primary-foreground" />
            </div>
            {isOpen && (
              <div>
                <div className="text-lg font-bold text-foreground">TarifScope</div>
              </div>
            )}
          </div>
        </div>
        <nav className="space-y-2">
          <Link
            href="/app"
            className={`flex items-center ${isOpen ? "gap-3 px-3" : "justify-center px-2"} py-3 rounded-lg text-sm font-medium transition-colors ${
              isActive("/app") && pathname === "/app"
                ? "text-primary bg-primary/10 hover:bg-primary/15"
                : "text-foreground hover:bg-accent hover:text-foreground"
            }`}
            title={!isOpen ? "Dashboard" : undefined}
          >
            <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
            {isOpen && <span>Dashboard</span>}
          </Link>
          <Link
            href="/app/competitors"
            className={`flex items-center ${isOpen ? "gap-3 px-3" : "justify-center px-2"} py-3 rounded-lg text-sm font-medium transition-colors ${
              isActive("/app/competitors")
                ? "text-primary bg-primary/10 hover:bg-primary/15"
                : "text-foreground hover:bg-accent hover:text-foreground"
            }`}
            title={!isOpen ? "Concurrents" : undefined}
          >
            <Users className="h-5 w-5 flex-shrink-0" />
            {isOpen && <span>Concurrents</span>}
          </Link>
          <Link
            href="/app/history"
            className={`flex items-center ${isOpen ? "gap-3 px-3" : "justify-center px-2"} py-3 rounded-lg text-sm font-medium transition-colors ${
              isActive("/app/history")
                ? "text-primary bg-primary/10 hover:bg-primary/15"
                : "text-foreground hover:bg-accent hover:text-foreground"
            }`}
            title={!isOpen ? "Historique" : undefined}
          >
            <History className="h-5 w-5 flex-shrink-0" />
            {isOpen && <span>Historique</span>}
          </Link>
          <Link
            href="/app/alerts"
            className={`flex items-center ${isOpen ? "gap-3 px-3" : "justify-center px-2"} py-3 rounded-lg text-sm font-medium transition-colors ${
              isActive("/app/alerts")
                ? "text-primary bg-primary/10 hover:bg-primary/15"
                : "text-foreground hover:bg-accent hover:text-foreground"
            }`}
            title={!isOpen ? "Alertes" : undefined}
          >
            <Bell className="h-5 w-5 flex-shrink-0" />
            {isOpen && <span>Alertes</span>}
          </Link>
          <Link
            href="/app/settings"
            className={`flex items-center ${isOpen ? "gap-3 px-3" : "justify-center px-2"} py-3 rounded-lg text-sm font-medium transition-colors ${
              isActive("/app/settings")
                ? "text-primary bg-primary/10 hover:bg-primary/15"
                : "text-foreground hover:bg-accent hover:text-foreground"
            }`}
            title={!isOpen ? "Paramètres" : undefined}
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            {isOpen && <span>Paramètres</span>}
          </Link>
          <Link
            href="/app/account"
            className={`flex items-center ${isOpen ? "gap-3 px-3" : "justify-center px-2"} py-3 rounded-lg text-sm font-medium transition-colors ${
              isActive("/app/account")
                ? "text-primary bg-primary/10 hover:bg-primary/15"
                : "text-foreground hover:bg-accent hover:text-foreground"
            }`}
            title={!isOpen ? "Mon compte" : undefined}
          >
            <User className="h-5 w-5 flex-shrink-0" />
            {isOpen && <span>Mon compte</span>}
          </Link>
        </nav>
      </div>
      <div className="p-4 border-t space-y-2">
        <button 
          onClick={toggle}
          className={`flex items-center ${isOpen ? "gap-3 px-3" : "justify-center px-2"} py-3 rounded-lg text-sm font-medium text-foreground hover:bg-accent hover:text-foreground transition-colors w-full`}
          title={!isOpen ? "Agrandir" : undefined}
        >
          {isOpen ? <ChevronLeft className="h-5 w-5 flex-shrink-0" /> : <ChevronRight className="h-5 w-5 flex-shrink-0" />}
          {isOpen && <span>Réduire</span>}
        </button>
        <button 
          onClick={handleSignOut}
          className={`flex items-center ${isOpen ? "gap-3 px-3" : "justify-center px-2"} py-3 rounded-lg text-sm font-medium text-foreground hover:bg-accent hover:text-foreground transition-colors w-full`}
          title={!isOpen ? "Déconnexion" : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {isOpen && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}
