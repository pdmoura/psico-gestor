import { Users, CheckCircle, TrendingUp, AlertTriangle, ChevronRight } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

export const DashboardView = () => {
  // Sessions data (source of truth)
  const allSessions = [
    { time: "09:00", name: "Fernanda Lima", status: "Realizado", val: 200, payment: "Pago" },
    { time: "10:00", name: "Pedro Henrique", status: "Realizado", val: 250, payment: "Pago" },
    { time: "11:00", name: "Juliana Martins", status: "Realizado", val: 200, payment: "Pago" },
    { time: "13:00", name: "Rafael Almeida", status: "Realizado", val: 180, payment: "Pendente" },
    { time: "14:00", name: "Carlos Andrade", status: "Agendado", val: 200, payment: "Pendente" },
    { time: "15:30", name: "Luiza Ferreira", status: "Agendado", val: 250, payment: "Pendente" },
    { time: "16:00", name: "Marília Santos", status: "Agendado", val: 180, payment: "Pendente" },
    { time: "17:00", name: "Roberto Mendes", status: "Cancelado", val: 200, payment: "Cancelado" },
  ];

  const todaySessions = allSessions.filter(s => s.status !== "Realizado");

  // Computed KPIs
  const totalSessionsMonth = 38;
  const paidSessions = 22;
  const pendingSessions = 9;
  const cancelledSessions = 7;
  const totalRevenue = 13_600;
  const pendingRevenue = paidSessions > 0 ? pendingSessions * 200 : 0; // ~R$ 1.800

  const kpis = [
    { label: "Pacientes ativos", value: "47", icon: Users, trend: "+3 este mês", trendUp: true, delay: "stagger-1" },
    { label: "Sessões este mês", value: String(totalSessionsMonth), icon: CheckCircle, trend: "Dentro da média", trendUp: true, delay: "stagger-2" },
    { label: "Faturamento", value: `R$ ${(totalRevenue).toLocaleString("pt-BR")}`, icon: TrendingUp, trend: "+12% vs mês ant.", trendUp: true, delay: "stagger-3" },
    { label: "Pendentes", value: `R$ ${pendingRevenue.toLocaleString("pt-BR")}`, icon: AlertTriangle, badge: `${pendingSessions} sessões`, isAlert: true, delay: "stagger-4" },
  ];

  // Bar chart data aligned with revenue numbers
  const barData = [
    { month: "Jan", val: 9000 },
    { month: "Fev", val: 11200 },
    { month: "Mar", val: 9800 },
    { month: "Abr", val: 10500 },
    { month: "Mai", val: 12100 },
    { month: "Jun", val: 11800 },
    { month: "Jul", val: 13200 },
    { month: "Ago", val: 13600 },
  ];
  const maxBar = 15000;

  // Donut chart values
  const paidPct = Math.round((paidSessions / totalSessionsMonth) * 100);
  const pendingPct = Math.round((pendingSessions / totalSessionsMonth) * 100);
  const cancelledPct = 100 - paidPct - pendingPct;

  // SVG donut math
  const paidDash = paidPct;
  const pendingDash = pendingPct;
  const cancelledDash = cancelledPct;

  return (
    <div className="space-y-6 animate-fade-in">
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
              {barData.map((d, i) => {
                const heightPct = (d.val / maxBar) * 100;
                const label = d.val >= 1000 ? `${(d.val / 1000).toFixed(1).replace(".0", "")}k` : String(d.val);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
                    <div
                      className="w-full bg-primary/80 rounded-t-md transition-all duration-500 hover:bg-primary min-w-[20px]"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground">{d.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-base font-semibold text-foreground mb-5">Sessões do mês</h3>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-40 h-40 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="hsl(var(--status-neutral-border))" strokeWidth="3.5" strokeDasharray={`${cancelledDash}, ${100 - cancelledDash}`} strokeDashoffset="0" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="hsl(var(--status-error-border))" strokeWidth="3.5" strokeDasharray={`${pendingDash}, ${100 - pendingDash}`} strokeDashoffset={`-${cancelledDash}`} />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="hsl(var(--status-success-border))" strokeWidth="3.5" strokeDasharray={`${paidDash}, ${100 - paidDash}`} strokeDashoffset={`-${cancelledDash + pendingDash}`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-foreground">{totalSessionsMonth}</span>
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
            </div>
            <div className="space-y-3 w-full">
              {[
                { label: "Pagas", pct: `${paidPct}% (${paidSessions})`, color: "bg-[hsl(var(--status-success-border))]" },
                { label: "Pendentes", pct: `${pendingPct}% (${pendingSessions})`, color: "bg-[hsl(var(--status-error-border))]" },
                { label: "Canceladas", pct: `${cancelledPct}% (${cancelledSessions})`, color: "bg-[hsl(var(--status-neutral-border))]" },
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
              {todaySessions.map((row, i) => (
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
          {todaySessions.map((row, i) => (
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
