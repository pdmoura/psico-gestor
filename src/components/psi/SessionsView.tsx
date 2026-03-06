import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { Modal } from "./Modal";

interface Session {
  id: number;
  patient: string;
  date: string;
  time: string;
  status: string;
  type: string;
  val: string;
  payment: string;
}

export const SessionsView = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const sessions: Session[] = [
    { id: 1, patient: "Alice Guimarães", date: "Hoje", time: "14:00 - 14:50", status: "Agendado", type: "Online", val: "R$ 200,00", payment: "Pendente" },
    { id: 2, patient: "Bruno Costa", date: "Hoje", time: "15:30 - 16:20", status: "Realizado", type: "Presencial", val: "R$ 180,00", payment: "Pago" },
    { id: 3, patient: "Carla Dias", date: "Amanhã", time: "10:00 - 10:50", status: "Agendado", type: "Online", val: "R$ 250,00", payment: "Pendente" },
  ];

  const openDetails = (session: Session) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">Agenda de Sessões</h2>
        <Button className="gap-2"><Plus size={16} /> Nova Sessão</Button>
      </div>

      {/* Desktop Calendar */}
      <div className="hidden lg:block bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[80px_repeat(5,1fr)] border-b border-border bg-muted/50">
          <div className="px-3 py-3 text-xs font-medium text-muted-foreground">Horário</div>
          {["Seg\n23 Out", "Ter (Hoje)\n24 Out", "Qua\n25 Out", "Qui\n26 Out", "Sex\n27 Out"].map((day, i) => (
            <div key={i} className={`px-3 py-3 text-xs font-medium text-center whitespace-pre-line ${i === 1 ? "text-primary font-bold" : "text-muted-foreground"}`}>
              {day}
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="max-h-[500px] overflow-y-auto">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-[80px_repeat(5,1fr)] border-b border-border last:border-0 min-h-[60px]">
              <div className="px-3 py-2 text-xs text-muted-foreground border-r border-border flex items-start pt-3">
                {hour}:00
              </div>
              {/* Mon */}
              <div className="border-r border-border relative p-1" />
              {/* Tue (Today) */}
              <div className="border-r border-border relative p-1 bg-primary/[0.02]">
                {hour === 14 && (
                  <button
                    onClick={() => openDetails(sessions[0])}
                    className="w-full h-[52px] bg-[hsl(var(--status-info-bg))] border-l-4 border-[hsl(var(--status-info-border))] rounded p-2 text-left hover:shadow-md transition-all"
                  >
                    <p className="text-xs font-semibold text-foreground truncate">{sessions[0].patient}</p>
                    <p className="text-[10px] text-muted-foreground">{sessions[0].time}</p>
                  </button>
                )}
                {hour === 15 && (
                  <button
                    onClick={() => openDetails(sessions[1])}
                    className="w-full h-[52px] bg-[hsl(var(--status-success-bg))] border-l-4 border-[hsl(var(--status-success-border))] rounded p-2 text-left hover:shadow-md transition-all"
                  >
                    <p className="text-xs font-semibold text-foreground truncate">{sessions[1].patient}</p>
                    <p className="text-[10px] text-muted-foreground">{sessions[1].time}</p>
                  </button>
                )}
              </div>
              {/* Wed */}
              <div className="border-r border-border relative p-1">
                {hour === 10 && (
                  <button
                    onClick={() => openDetails(sessions[2])}
                    className="w-full h-[52px] bg-[hsl(var(--status-info-bg))] border-l-4 border-[hsl(var(--status-info-border))] rounded p-2 text-left hover:shadow-md transition-all"
                  >
                    <p className="text-xs font-semibold text-foreground truncate">{sessions[2].patient}</p>
                    <p className="text-[10px] text-muted-foreground">{sessions[2].time}</p>
                  </button>
                )}
              </div>
              {/* Thu */}
              <div className="border-r border-border relative p-1" />
              {/* Fri */}
              <div className="relative p-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile List */}
      <div className="lg:hidden space-y-4">
        {["Hoje", "Amanhã"].map((day) => {
          const daySessions = sessions.filter((s) => s.date === day);
          if (daySessions.length === 0) return null;
          return (
            <div key={day}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">{day}</h3>
              <div className="space-y-3">
                {daySessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => openDetails(s)}
                    className="w-full bg-card border border-border rounded-xl p-4 text-left shadow-sm active:scale-[0.98] transition-transform"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground">{s.patient}</span>
                      <StatusBadge status={s.status} />
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="space-y-1">
                        <p>🕒 {s.time}</p>
                        <p>📍 {s.type}</p>
                      </div>
                      <span className="text-foreground font-medium">{s.val}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Detalhes da Sessão">
        {selectedSession && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Paciente</p>
                <p className="font-medium text-foreground">{selectedSession.patient}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Horário</p>
                <p className="font-medium text-foreground">{selectedSession.time}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Modalidade</p>
                <p className="font-medium text-foreground">{selectedSession.type}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Valor</p>
                <p className="font-medium text-foreground">{selectedSession.val}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Status</p>
                <StatusBadge status={selectedSession.status} />
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Pagamento</p>
                <StatusBadge status={selectedSession.payment} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Fechar</Button>
              <Button>Registrar Pagamento</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
