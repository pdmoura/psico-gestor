import { useState, useEffect } from "react";
import { LayoutDashboard, Users, Calendar, TrendingUp, Settings, LogOut, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ViewType = "dashboard" | "patients" | "sessions" | "finance" | "settings";

interface SidebarProps {
  isOpen: boolean;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onLogout: () => void;
  onCloseMobile: () => void;
}

const navItems: { id: ViewType; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "patients", label: "Pacientes", icon: Users },
  { id: "sessions", label: "Sessões", icon: Calendar },
  { id: "finance", label: "Financeiro", icon: TrendingUp },
  { id: "settings", label: "Configurações", icon: Settings },
];

export const Sidebar = ({ isOpen, currentView, onViewChange, onLogout, onCloseMobile }: SidebarProps) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ full_name: string | null; crp: string | null }>({ full_name: null, crp: null });

  useEffect(() => {
    if (!user) return;
    supabase.from("psychologist_settings").select("full_name, crp").eq("user_id", user.id).single()
      .then(({ data }) => {
        if (data) setProfile({ full_name: data.full_name, crp: data.crp });
      });
  }, [user]);

  const displayName = profile.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário";
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-foreground/50 z-30 lg:hidden" onClick={onCloseMobile} />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-[260px] bg-sidebar z-40 flex flex-col transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="flex items-center justify-between p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">P</div>
            <span className="text-lg font-bold text-sidebar-primary-foreground">PsiGestão</span>
          </div>
          <button onClick={onCloseMobile} className="lg:hidden p-1 text-sidebar-foreground hover:text-sidebar-primary-foreground" aria-label="Fechar menu">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/30 flex items-center justify-center text-primary-foreground font-semibold text-sm">
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-sidebar-primary-foreground truncate max-w-[160px]">{displayName}</p>
              {profile.crp && <p className="text-xs text-sidebar-foreground">CRP {profile.crp}</p>}
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onViewChange(item.id); onCloseMobile(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive
                    ? "bg-sidebar-accent/10 text-sidebar-primary-foreground border-l-[3px] border-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/5 hover:text-sidebar-primary-foreground border-l-[3px] border-transparent"
                  }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/5 hover:text-sidebar-primary-foreground transition-colors"
          >
            <LogOut size={18} />
            Sair da conta
          </button>
        </div>
      </aside>
    </>
  );
};
