import { useState, useEffect } from "react";
import { Users, CheckCircle, TrendingUp, AlertTriangle, ChevronRight, Clock } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { DashboardChartModal, type SessionDetail } from "./DashboardChartModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, startOfMonth, endOfMonth, subMonths, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ViewType } from "./Sidebar";

interface DashboardViewProps {
  onNavigate: (view: ViewType) => void;
}

interface MonthData {
  month: string;
  key: string;
  val: number;
  sessions: SessionDetail[];
}

export const DashboardView = ({ onNavigate }: DashboardViewProps) => {
  const { user } = useAuth();
  const [activePatients, setActivePatients] = useState(0);
  const [monthSessions, setMonthSessions] = useState({ total: 0, paid: 0, pending: 0, cancelled: 0 });
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [pendingRevenue, setPendingRevenue] = useState(0);
  const [barData, setBarData] = useState<MonthData[]>([]);
  const [todaySessions, setTodaySessions] = useState<{ time: string; name: string; status: string; id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalSessions, setModalSessions] = useState<SessionDetail[]>([]);

  // Current month session details for donut chart
  const [currentMonthDetails, setCurrentMonthDetails] = useState<{
    paid: SessionDetail[];
    pending: SessionDetail[];
    cancelled: SessionDetail[];
  }>({ paid: [], pending: [], cancelled: [] });

  useEffect(() => {
    if (!user) return;

    const metaName = user.user_metadata?.full_name;
    if (metaName) {
      setDisplayName(metaName);
    } else {
      supabase.from("psychologist_settings").select("full_name").eq("user_id", user.id).single()
        .then(({ data }) => setDisplayName(data?.full_name || user.email?.split("@")[0] || ""));
    }

    const fetchDashboard = async () => {
      const now = new Date();
      const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");
      const todayStr = format(startOfDay(now), "yyyy-MM-dd");

      // For the bar chart: fetch sessions from last 8 months with patient names
      const eightMonthsAgo = format(startOfMonth(subMonths(now, 7)), "yyyy-MM-dd");

      const [patientsRes, sessionsRes, todayRes, allSessionsRes] = await Promise.all([
        supabase.from("patients").select("id", { count: "exact" }).eq("status", "Ativo"),
        supabase.from("sessions").select("status, payment_status, value, date, patients(name)").gte("date", monthStart).lte("date", monthEnd),
        supabase.from("sessions").select("id, start_time, status, patients(name)").eq("date", todayStr).order("start_time"),
        supabase.from("sessions").select("status, payment_status, value, date, patients(name)").gte("date", eightMonthsAgo).lte("date", monthEnd),
      ]);

      setActivePatients(patientsRes.count || 0);

      // Current month KPIs
      const sess = sessionsRes.data || [];
      const paid = sess.filter(s => s.payment_status === "Pago").length;
      const pending = sess.filter(s => s.payment_status === "Pendente").length;
      const cancelled = sess.filter(s => s.status === "Cancelado").length;
      setMonthSessions({ total: sess.length, paid, pending, cancelled });

      const rev = sess.filter(s => s.payment_status === "Pago").reduce((s, r) => s + r.value, 0);
      const pend = sess.filter(s => s.payment_status === "Pendente").reduce((s, r) => s + r.value, 0);
      setTotalRevenue(rev);
      setPendingRevenue(pend);

      // Current month details for donut
      const toDetail = (s: any): SessionDetail => ({
        patientName: (s.patients as any)?.name || "—",
        date: s.date,
        value: s.value,
        status: s.status,
        paymentStatus: s.payment_status,
      });

      setCurrentMonthDetails({
        paid: sess.filter(s => s.payment_status === "Pago").map(toDetail),
        pending: sess.filter(s => s.payment_status === "Pendente" && s.status !== "Cancelado").map(toDetail),
        cancelled: sess.filter(s => s.status === "Cancelado").map(toDetail),
      });

      // Today sessions
      setTodaySessions((todayRes.data || []).map((s: any) => ({
        id: s.id,
        time: s.start_time?.substring(0, 5) || "",
        name: s.patients?.name || "—",
        status: s.status,
      })));

      // Bar chart: group all sessions by month (revenue = paid sessions)
      const allSess = allSessionsRes.data || [];
      const months: MonthData[] = [];
      for (let i = 7; i >= 0; i--) {
        const d = subMonths(now, i);
        const key = format(d, "yyyy-MM");
        const label = format(d, "MMM", { locale: ptBR }).charAt(0).toUpperCase() + format(d, "MMM", { locale: ptBR }).slice(1);
        const monthSess = allSess.filter(t => t.date.startsWith(key) && t.payment_status === "Pago");
        const total = monthSess.reduce((s, t) => s + t.value, 0);
        months.push({
          month: label,
          key,
          val: total,
          sessions: monthSess.map(toDetail),
        });
      }
      setBarData(months);
      setLoading(false);
    };
    fetchDashboard();
  }, [user]);

  const openModal = (title: string, sessions: SessionDetail[]) => {
    setModalTitle(title);
    setModalSessions(sessions);
    setModalOpen(true);
  };

  if (loading) return <div className="flex items-center justify-center py-16 text-muted-foreground">Carregando...</div>;

  const maxBar = Math.max(...barData.map(d => d.val), 1) * 1.15;
  const paidPct = monthSessions.total ? Math.round((monthSessions.paid / monthSessions.total) * 100) : 0;
  const pendingPct = monthSessions.total ? Math.round((monthSessions.pending / monthSessions.total) * 100) : 0;
  const cancelledPct = monthSessions.total ? 100 - paidPct - pendingPct : 0;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  })();

  const kpis = [
    { label: "Pacientes ativos", value: String(activePatients), icon: Users, nav: "patients" as ViewType },
    { label: "Sessões este mês", value: String(monthSessions.total), icon: CheckCircle, nav: "sessions" as ViewType },
    { label: "Faturamento", value: `R$ ${totalRevenue.toLocaleString("pt-BR")}`, icon: TrendingUp, nav: "finance" as ViewType },
    { label: "Pendentes", value: `R$ ${pendingRevenue.toLocaleString("pt-BR")}`, icon: AlertTriangle, isAlert: true, badge: `${monthSessions.pending} sessões`, nav: "finance" as ViewType },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{greeting}, {displayName} 👋</h2>
        <p className="text-sm text-muted-foreground mt-1">Aqui está o resumo da sua semana</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <button key={i} onClick={() => onNavigate(kpi.nav)}
            className={`text-left animate-fade-up stagger-${i + 1} bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${kpi.isAlert ? "bg-[hsl(var(--status-warning-bg))] text-[hsl(var(--status-warning-text))]" : "bg-primary/10 text-primary"}`}>
                <kpi.icon size={20} />
              </div>
              {kpi.badge && <StatusBadge status="pendente">{kpi.badge}</StatusBadge>}
            </div>
            <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.isAlert ? "text-[hsl(var(--status-warning-text))]" : "text-foreground"}`}>{kpi.value}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Bar Chart */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-foreground">Faturamento mensal</h3>
            <button onClick={() => onNavigate("finance")} className="text-sm text-[hsl(var(--text-link))] hover:underline flex items-center gap-1">Detalhes <ChevronRight size={14} /></button>
          </div>
          <div className="flex gap-2 items-end h-48">
            <div className="flex flex-col justify-between text-[10px] text-muted-foreground h-full py-1 pr-2">
              <span>{Math.round(maxBar / 1000)}k</span>
              <span>{Math.round(maxBar * 0.66 / 1000)}k</span>
              <span>{Math.round(maxBar * 0.33 / 1000)}k</span>
              <span>0</span>
            </div>
            <div className="flex-1 flex gap-2 sm:gap-3 h-full">
              {barData.map((d, i) => {
                const heightPct = maxBar > 0 ? (d.val / maxBar) * 100 : 0;
                const label = d.val >= 1000 ? `${(d.val / 1000).toFixed(1).replace(".0", "")}k` : String(d.val);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
                    <div className="w-full flex-1 flex items-end">
                      <button
                        onClick={() => openModal(`Faturamento — ${d.month}`, d.sessions)}
                        className="w-full bg-primary/80 rounded-t-md transition-all duration-500 hover:bg-primary cursor-pointer"
                        style={{ height: `${Math.max(heightPct, d.val > 0 ? 4 : 0)}%` }}
                        title={`Clique para ver detalhes de ${d.month}`}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{d.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sessions Donut Chart */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-foreground">Sessões do mês</h3>
            <button onClick={() => onNavigate("sessions")} className="text-sm text-[hsl(var(--text-link))] hover:underline flex items-center gap-1">Ver todas <ChevronRight size={14} /></button>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-40 h-40 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="hsl(var(--status-neutral-border))" strokeWidth="3.5" strokeDasharray={`${cancelledPct}, ${100 - cancelledPct}`} strokeDashoffset="0" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="hsl(var(--status-error-border))" strokeWidth="3.5" strokeDasharray={`${pendingPct}, ${100 - pendingPct}`} strokeDashoffset={`-${cancelledPct}`} />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="hsl(var(--status-success-border))" strokeWidth="3.5" strokeDasharray={`${paidPct}, ${100 - paidPct}`} strokeDashoffset={`-${cancelledPct + pendingPct}`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-foreground">{monthSessions.total}</span>
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
            </div>
            <div className="space-y-3 w-full">
              {[
                { label: "Pagas", pct: `${paidPct}% (${monthSessions.paid})`, color: "bg-[hsl(var(--status-success-border))]", sessions: currentMonthDetails.paid },
                { label: "Pendentes", pct: `${pendingPct}% (${monthSessions.pending})`, color: "bg-[hsl(var(--status-error-border))]", sessions: currentMonthDetails.pending },
                { label: "Canceladas", pct: `${cancelledPct}% (${monthSessions.cancelled})`, color: "bg-[hsl(var(--status-neutral-border))]", sessions: currentMonthDetails.cancelled },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => openModal(`Sessões ${item.label.toLowerCase()}`, item.sessions)}
                  className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-sm text-foreground">{item.label}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{item.pct}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Today's Sessions Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-base font-semibold text-foreground">Sessões de hoje</h3>
          <button onClick={() => onNavigate("sessions")} className="text-sm text-[hsl(var(--text-link))] hover:underline flex items-center gap-1">Ver todas <ChevronRight size={14} /></button>
        </div>
        {todaySessions.length > 0 ? (
          <>
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
                  {todaySessions.map((row) => (
                    <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 font-medium text-foreground">{row.time}</td>
                      <td className="px-5 py-3 text-foreground">{row.name}</td>
                      <td className="px-5 py-3"><StatusBadge status={row.status} /></td>
                      <td className="px-5 py-3">
                        <button onClick={() => onNavigate("sessions")} className="text-[hsl(var(--text-link))] hover:underline text-sm flex items-center gap-1">Ver <ChevronRight size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="sm:hidden divide-y divide-border">
              {todaySessions.map((row) => (
                <button key={row.id} onClick={() => onNavigate("sessions")} className="w-full p-4 space-y-2 text-left hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{row.name}</span>
                    <StatusBadge status={row.status} />
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Clock size={14} /> {row.time}</p>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">Nenhuma sessão agendada para hoje.</div>
        )}
      </div>

      <DashboardChartModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        sessions={modalSessions}
      />
    </div>
  );
};
