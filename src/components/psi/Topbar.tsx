import { Menu, Bell, Moon, Sun } from "lucide-react";

interface TopbarProps {
  title: string;
  onMenuClick: () => void;
  isDark: boolean;
  toggleTheme: () => void;
}

export const Topbar = ({ title, onMenuClick, isDark, toggleTheme }: TopbarProps) => {
  return (
    <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-md border-b border-border px-4 sm:px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg text-foreground hover:bg-muted transition-colors" aria-label="Abrir menu">
          <Menu size={22} />
        </button>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={toggleTheme} className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors" aria-label="Alternar tema">
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <div className="relative">
          <button className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors" aria-label="Notificações">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              3
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
