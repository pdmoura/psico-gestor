import { useState } from "react";
import { TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

type FilterType = "todos" | "Pago" | "Pendente" | "Cancelado";

export const FinanceView = () => {
  const [filter, setFilter] = useState<FilterType>("todos");

  const transactions = [
    { patient: "Alice Guimarães", date: "24/10/2024", val: "R$ 200,00", status: "Pago" },
    { patient: "Bruno Costa", date: "24/10/2024", val: "R$ 180,00", status: "Pago" },
    { patient: "Fernanda Lima", date: "23/10/2024", val: "R$ 200,00", status: "Pago" },
    { patient: "Pedro Henrique", date: "23/10/2024", val: "R$ 250,00", status: "Pago" },
    { patient: "Juliana Martins", date: "22/10/2024", val: "R$ 200,00", status: "Pago" },
    { patient: "Carla Dias", date: "22/10/2024", val: "R$ 250,00", status: "Pendente" },
    { patient: "Rafael Almeida", date: "21/10/2024", val: "R$ 180,00", status: "Pendente" },
    { patient: "Luiza Ferreira", date: "21/10/2024", val: "R$ 250,00", status: "Pendente" },
    { patient: "Marília Santos", date: "20/10/2024", val: "R$ 180,00", status: "Pendente" },
    { patient: "Diego Lima", date: "20/10/2024", val: "R$ 200,00", status: "Cancelado" },
    { patient: "Roberto Mendes", date: "19/10/2024", val: "R$ 200,00", status: "Cancelado" },
  ];

  const filtered = filter === "todos" ? transactions : transactions.filter(t => t.status === filter);

  const filters: { label: string; value: FilterType }[] = [
    { label: "Todos", value: "todos" },
    { label: "Pagos", value: "Pago" },
    { label: "Pendentes", value: "Pendente" },
    { label: "Cancelados", value: "Cancelado" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-foreground">Financeiro</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total recebido", value: "R$ 12.800", icon: CheckCircle, color: "text-[hsl(var(--status-success-text))]", bg: "bg-[hsl(var(--status-success-bg))]" },
          { label: "Pendente", value: "R$ 2.400", icon: AlertTriangle, color: "text-[hsl(var(--status-warning-text))]", bg: "bg-[hsl(var(--status-warning-bg))]" },
          { label: "Média/sessão", value: "R$ 210", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
        ].map((c, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.bg} ${c.color} mb-3`}>
              <c.icon size={20} />
            </div>
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Transactions */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-base font-semibold text-foreground">Últimas transações</h3>
          <div className="flex gap-2 flex-wrap">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  filter === f.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:bg-muted/50"
                }`}
              >
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
              {filtered.length > 0 ? filtered.map((t, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-medium text-foreground">{t.patient}</td>
                  <td className="px-5 py-3 text-muted-foreground">{t.date}</td>
                  <td className="px-5 py-3 text-foreground font-medium">{t.val}</td>
                  <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">Nenhuma transação encontrada para este filtro.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="sm:hidden divide-y divide-border">
          {filtered.length > 0 ? filtered.map((t, i) => (
            <div key={i} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground text-sm">{t.patient}</p>
                <p className="text-xs text-muted-foreground">{t.date}</p>
              </div>
              <div className="text-right space-y-1">
                <p className="font-medium text-foreground text-sm">{t.val}</p>
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
