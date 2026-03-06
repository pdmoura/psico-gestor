import { Users, CheckCircle, TrendingUp, AlertTriangle, ChevronRight } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

export const DashboardView = () => {
  const kpis = [
    { label: "Pacientes ativos", value: "47", icon: Users, trend: "+3 este mês", trendUp: true, delay: "stagger-1" },
    { label: "Sessões este mês", value: "32", icon: CheckCircle, trend: "Dentro da média", trendUp: true, delay: "stagger-2" },
    { label: "Faturamento", value: "R$ 12.800", icon: TrendingUp, trend: "+12% vs mês ant.", trendUp: true, delay: "stagger-3" },
    { label: "Pendentes", value: "R$ 2.400", icon: AlertTriangle, badge: "4 sessões", isAlert: true, delay: "stagger-4" },
  ];

  const barData = [
    { month: "Jan", val: 60, lbl: "9k" },
    { month: "Fev", val: 75, lbl: "11.2k" },
    { month: "Mar", val: 65, lbl: "9.8k" },
    { month: "Abr", val: 85, lbl: "12.8k" },
    { month: "Mai", val: 90, lbl: "13.5k" },
    { month: "Jun", val: 80, lbl: "12k" },
  ];

  const sessions = [
    { time: "14:00", name: "Carlos Andrade", status: "Agendado" },
    { time: "15:30", name: "Luiza Ferreira", status: "Agendado" },
    { time: "17:00", name: "Roberto Mendes", status: "Cancelado" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Bom dia, Dra. Mariana 👋</h2>
        <p className="text-sm text-muted-foreground mt-1">Aqui está o resumo da sua semana</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div
            key={i}
            className={`animate-fade-up ${kpi.delay} bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${kpi.isAlert ? "bg-[hsl(var(--status-warning-bg))] text-[hsl(var(--status-warning-text))]" : "bg-primary/10 text-primary"}`}>
                <kpi.icon size={20} />
              </div>
              {kpi.badge && <StatusBadge status="pendente">{kpi.badge}</StatusBadge>}
            </div>
            <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.isAlert ? "text-[hsl(var(--status-warning-text))]" : "text-foreground"}`}>
              {kpi.value}
            </p>
            {kpi.trend && (
              <p className="text-xs text-muted-foreground mt-2">
                {kpi.trendUp && "↑ "}{kpi.trend}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-base font-semibold text-foreground mb-5">Faturamento mensal</h3>
          <div className="flex gap-2 items-end h-48">
            <div className="flex flex-col justify-between text-[10px] text-muted-foreground h-full py-1 pr-2">
              <span>15k</span><span>10k</span><span>5k</span><span>0</span>
            </div>
            <div className="flex-1 flex items-end gap-2 sm:gap-3 h-full">
              {barData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-medium text-muted-foreground">{d.lbl}</span>
                  <div
                    className="w-full bg-primary/80 rounded-t-md transition-all duration-500 hover:bg-primary min-w-[20px]"
                    style={{ height: `${d.val}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground">{d.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-base font-semibold text-foreground mb-5">Sessões do mês</h3>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-40 h-40 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="hsl(var(--status-neutral-border))" strokeWidth="3.5" strokeDasharray="20, 80" strokeDashoffset="0" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="hsl(var(--status-error-border))" strokeWidth="3.5" strokeDasharray="20, 80" strokeDashoffset="-20" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="hsl(var(--status-success-border))" strokeWidth="3.5" strokeDasharray="60, 40" strokeDashoffset="-40" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-foreground">32</span>
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
            </div>
            <div className="space-y-3 w-full">
              {[
                { label: "Pagas", pct: "60% (19)", color: "bg-[hsl(var(--status-success-border))]" },
                { label: "Pendentes", pct: "20% (6)", color: "bg-[hsl(var(--status-error-border))]" },
                { label: "Canceladas", pct: "20% (7)", color: "bg-[hsl(var(--status-neutral-border))]" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-sm text-foreground">{item.label}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{item.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-base font-semibold text-foreground">Próximas sessões hoje</h3>
          <button className="text-sm text-link hover:underline flex items-center gap-1">
            Ver todas <ChevronRight size={14} />
          </button>
        </div>

        {/* Desktop */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Horário</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Paciente</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((row, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-medium text-foreground">{row.time}</td>
                  <td className="px-5 py-3 text-foreground">{row.name}</td>
                  <td className="px-5 py-3"><StatusBadge status={row.status} /></td>
                  <td className="px-5 py-3">
                    <button className="text-link hover:underline text-sm flex items-center gap-1">
                      Ver <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="sm:hidden divide-y divide-border">
          {sessions.map((row, i) => (
            <div key={i} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">{row.name}</span>
                <StatusBadge status={row.status} />
              </div>
              <p className="text-sm text-muted-foreground">🕒 {row.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
