import { useState, useRef, useEffect } from "react";
import { Menu, Bell, Moon, Sun, X } from "lucide-react";

interface TopbarProps {
  title: string;
  onMenuClick: () => void;
  isDark: boolean;
  toggleTheme: () => void;
}

interface Notification {
  id: number;
  title: string;
  desc: string;
  time: string;
  read: boolean;
}

const initialNotifications: Notification[] = [
  { id: 1, title: "Sessão confirmada", desc: "Carlos Andrade confirmou a sessão de hoje às 14:00.", time: "Há 10 min", read: false },
  { id: 2, title: "Pagamento recebido", desc: "Luiza Ferreira pagou R$ 250,00 via PIX.", time: "Há 1h", read: false },
  { id: 3, title: "Lembrete", desc: "Você tem 3 sessões agendadas para amanhã.", time: "Há 2h", read: false },
  { id: 4, title: "Novo paciente", desc: "Marília Santos completou o cadastro.", time: "Há 5h", read: true },
  { id: 5, title: "Sessão cancelada", desc: "Roberto Mendes cancelou a sessão de hoje às 17:00.", time: "Ontem", read: true },
];

export const Topbar = ({ title, onMenuClick, isDark, toggleTheme }: TopbarProps) => {
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowNotif(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

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

        {/* Notifications */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Notificações"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-12 w-80 sm:w-96 bg-card border border-border rounded-xl shadow-lg overflow-hidden animate-fade-in z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Notificações</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-link hover:underline">
                      Marcar todas como lidas
                    </button>
                  )}
                  <button onClick={() => setShowNotif(false)} className="p-1 rounded hover:bg-muted text-muted-foreground">
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-border">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
                    onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                      <div className={!n.read ? "" : "ml-4"}>
                        <p className="text-sm font-medium text-foreground">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
