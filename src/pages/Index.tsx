import { useState, useEffect } from "react";
import { Sidebar, type ViewType } from "@/components/psi/Sidebar";
import { Topbar } from "@/components/psi/Topbar";
import { AuthView } from "@/components/psi/AuthView";
import { DashboardView } from "@/components/psi/DashboardView";
import { PatientsView } from "@/components/psi/PatientsView";
import { SessionsView } from "@/components/psi/SessionsView";
import { FinanceView } from "@/components/psi/FinanceView";
import { SettingsView } from "@/components/psi/SettingsView";
import { useAuth } from "@/hooks/useAuth";

const viewTitles: Record<ViewType, string> = {
  dashboard: "Dashboard",
  patients: "Pacientes",
  sessions: "Sessões",
  finance: "Financeiro",
  settings: "Configurações",
};

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  const renderView = () => {
    switch (currentView) {
      case "dashboard": return <DashboardView onNavigate={setCurrentView} />;
      case "patients": return <PatientsView />;
      case "sessions": return <SessionsView />;
      case "finance": return <FinanceView />;
      case "settings": return <SettingsView />;
      default: return <DashboardView onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        isOpen={sidebarOpen}
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={signOut}
        onCloseMobile={() => setSidebarOpen(false)}
      />
      <div className="lg:ml-[260px] min-h-screen flex flex-col">
        <Topbar
          title={viewTitles[currentView]}
          onMenuClick={() => setSidebarOpen(true)}
          isDark={isDark}
          toggleTheme={() => setIsDark(!isDark)}
        />
        <main className="flex-1 p-4 sm:p-6">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default Index;
