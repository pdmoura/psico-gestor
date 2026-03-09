import { useState, useEffect } from "react";
import { TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type FilterType = "todos" | "Pago" | "Pendente" | "Cancelado";

interface TransactionRow {
  id: string;
  patient_name: string;
  date: string;
  value: number;
  status: string;
}

export const FinanceView = () => {
  const [filter, setFilter] = useState<FilterType>("todos");
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*, patients(name)")
      .order("date", { ascending: false });
    if (error) { toast.error("Erro ao carregar transações"); return; }
    setTransactions((data || []).map((t: any) => ({
      id: t.id,
      patient_name: t.patients?.name || "—",
      date: new Date(t.date).toLocaleDateString("pt-BR"),
      value: t.value,
      status: t.status,
    })));
    setLoading(false);
  };

  useEffect(() => { fetchTransactions(); }, []);

  const filtered = filter === "todos" ? transactions : transactions.filter(t => t.status === filter);

  const totalPaid = transactions.filter(t => t.status === "Pago").reduce((s, t) => s + t.value, 0);
  const totalPending = transactions.filter(t => t.status === "Pendente").reduce((s, t) => s + t.value, 0);
  const paidCount = transactions.filter(t => t.status === "Pago").length;
  const avg = paidCount > 0 ? Math.round(totalPaid / paidCount) : 0;

  const filters: { label: string; value: FilterType }[] = [
    { label: "Todos", value: "todos" },
    { label: "Pagos", value: "Pago" },
    { label: "Pendentes", value: "Pendente" },
    { label: "Cancelados", value: "Cancelado" },
  ];

  if (loading) return <div className="flex items-center justify-center py-16 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-foreground">Financeiro</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total recebido", value: `R$ ${totalPaid.toLocaleString("pt-BR")}`, icon: CheckCircle, color: "text-[hsl(var(--status-success-text))]", bg: "bg-[hsl(var(--status-success-bg))]" },
          { label: "Pendente", value: `R$ ${totalPending.toLocaleString("pt-BR")}`, icon: AlertTriangle, color: "text-[hsl(var(--status-warning-text))]", bg: "bg-[hsl(var(--status-warning-bg))]" },
          { label: "Média/sessão", value: `R$ ${avg}`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
        ].map((c, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.bg} ${c.color} mb-3`}><c.icon size={20} /></div>
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-base font-semibold text-foreground">Últimas transações</h3>
          <div className="flex gap-2 flex-wrap">
            {filters.map((f) => (
              <button key={f.value} onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${filter === f.value ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted/50"}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Paciente</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Data</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Valor</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-medium text-foreground">{t.patient_name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{t.date}</td>
                  <td className="px-5 py-3 text-foreground font-medium">R$ {t.value}</td>
                  <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">Nenhuma transação encontrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="sm:hidden divide-y divide-border">
          {filtered.length > 0 ? filtered.map((t) => (
            <div key={t.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground text-sm">{t.patient_name}</p>
                <p className="text-xs text-muted-foreground">{t.date}</p>
              </div>
              <div className="text-right space-y-1">
                <p className="font-medium text-foreground text-sm">R$ {t.value}</p>
                <StatusBadge status={t.status} />
              </div>
            </div>
          )) : (
            <div className="p-8 text-center text-muted-foreground text-sm">Nenhuma transação encontrada.</div>
          )}
        </div>
      </div>
    </div>
  );
};
