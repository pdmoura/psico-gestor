import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { Modal } from "./Modal";
import { FormInput } from "./FormInput";

interface Session {
  id: number;
  patient: string;
  date: string;
  time: string;
  status: string;
  type: string;
  val: string;
  payment: string;
  dayIndex?: number; // 0=Mon..4=Fri
  hour?: number;
}

export const SessionsView = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [newSessionDefaults, setNewSessionDefaults] = useState<{ dayIndex?: number; hour?: number }>({});

  const [sessions, setSessions] = useState<Session[]>([
    { id: 1, patient: "Alice Guimarães", date: "Hoje", time: "14:00 - 14:50", status: "Agendado", type: "Online", val: "R$ 200,00", payment: "Pendente", dayIndex: 1, hour: 14 },
    { id: 2, patient: "Bruno Costa", date: "Hoje", time: "15:30 - 16:20", status: "Realizado", type: "Presencial", val: "R$ 180,00", payment: "Pago", dayIndex: 1, hour: 15 },
    { id: 3, patient: "Carla Dias", date: "Amanhã", time: "10:00 - 10:50", status: "Agendado", type: "Online", val: "R$ 250,00", payment: "Pendente", dayIndex: 2, hour: 10 },
    { id: 4, patient: "Fernanda Lima", date: "Hoje", time: "09:00 - 09:50", status: "Realizado", type: "Online", val: "R$ 200,00", payment: "Pago", dayIndex: 1, hour: 9 },
    { id: 5, patient: "Pedro Henrique", date: "Amanhã", time: "14:00 - 14:50", status: "Agendado", type: "Presencial", val: "R$ 250,00", payment: "Pendente", dayIndex: 2, hour: 14 },
    { id: 6, patient: "Juliana Martins", date: "Qui", time: "11:00 - 11:50", status: "Agendado", type: "Online", val: "R$ 200,00", payment: "Pendente", dayIndex: 3, hour: 11 },
    { id: 7, patient: "Rafael Almeida", date: "Sex", time: "16:00 - 16:50", status: "Agendado", type: "Online", val: "R$ 180,00", payment: "Pendente", dayIndex: 4, hour: 16 },
  ]);

  const openDetails = (session: Session) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  const openNewSession = (dayIndex?: number, hour?: number) => {
    setNewSessionDefaults({ dayIndex, hour });
    setIsNewModalOpen(true);
  };

  const handleCreateSession = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const patient = fd.get("patient") as string;
    const time = fd.get("time") as string;
    const type = fd.get("type") as string;
    const val = fd.get("val") as string;

    if (!patient || !time) return;

    const newSession: Session = {
      id: Date.now(),
      patient,
      date: "Hoje",
      time: `${time} - ${String(Number(time.split(":")[0]) + 1).padStart(2, "0")}:${time.split(":")[1] || "00"}`,
      status: "Agendado",
      type: type || "Online",
      val: val || "R$ 200,00",
      payment: "Pendente",
      dayIndex: newSessionDefaults.dayIndex ?? 1,
      hour: Number(time.split(":")[0]),
    };
    setSessions(prev => [...prev, newSession]);
    setIsNewModalOpen(false);
  };

  const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
  const days = [
    { label: "Seg\n23 Out", index: 0 },
    { label: "Ter (Hoje)\n24 Out", index: 1 },
    { label: "Qua\n25 Out", index: 2 },
    { label: "Qui\n26 Out", index: 3 },
    { label: "Sex\n27 Out", index: 4 },
  ];

  const getSessionAt = (dayIndex: number, hour: number) =>
    sessions.find(s => s.dayIndex === dayIndex && s.hour === hour);

  const getStatusColor = (status: string) => {
    if (status === "Realizado") return { bg: "bg-[hsl(var(--status-success-bg))]", border: "border-[hsl(var(--status-success-border))]" };
    return { bg: "bg-[hsl(var(--status-info-bg))]", border: "border-[hsl(var(--status-info-border))]" };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">Agenda de Sessões</h2>
        <Button className="gap-2" onClick={() => openNewSession()}><Plus size={16} /> Nova Sessão</Button>
      </div>

      {/* Desktop Calendar */}
      <div className="hidden lg:block bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-[80px_repeat(5,1fr)] border-b border-border bg-muted/50">
          <div className="px-3 py-3 text-xs font-medium text-muted-foreground">Horário</div>
          {days.map((day) => (
            <div key={day.index} className={`px-3 py-3 text-xs font-medium text-center whitespace-pre-line ${day.index === 1 ? "text-primary font-bold" : "text-muted-foreground"}`}>
              {day.label}
            </div>
          ))}
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-[80px_repeat(5,1fr)] border-b border-border last:border-0 min-h-[60px]">
              <div className="px-3 py-2 text-xs text-muted-foreground border-r border-border flex items-start pt-3">
                {hour}:00
              </div>
              {days.map((day) => {
                const session = getSessionAt(day.index, hour);
                const colors = session ? getStatusColor(session.status) : null;
                return (
                  <div
                    key={day.index}
                    className={`border-r border-border last:border-r-0 relative p-1 cursor-pointer hover:bg-muted/30 transition-colors ${day.index === 1 ? "bg-primary/[0.02]" : ""}`}
                    onDoubleClick={() => !session && openNewSession(day.index, hour)}
                  >
                    {session ? (
                      <button
                        onClick={() => openDetails(session)}
                        className={`w-full h-[52px] ${colors!.bg} border-l-4 ${colors!.border} rounded p-2 text-left hover:shadow-md transition-all`}
                      >
                        <p className="text-xs font-semibold text-foreground truncate">{session.patient}</p>
                        <p className="text-[10px] text-muted-foreground">{session.time}</p>
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile List */}
      <div className="lg:hidden space-y-4">
        {["Hoje", "Amanhã", "Qui", "Sex"].map((day) => {
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

      {/* New Session Modal */}
      <Modal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} title="Nova Sessão">
        <form onSubmit={handleCreateSession} className="space-y-4">
          <FormInput label="Paciente" id="new-patient" name="patient" placeholder="Nome do paciente" required />
          <FormInput
            label="Horário"
            id="new-time"
            name="time"
            type="time"
            defaultValue={newSessionDefaults.hour ? `${String(newSessionDefaults.hour).padStart(2, "0")}:00` : ""}
            required
          />
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Modalidade</label>
            <select name="type" className="w-full h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-ring focus:outline-none">
              <option value="Online">Online</option>
              <option value="Presencial">Presencial</option>
            </select>
          </div>
          <FormInput label="Valor" id="new-val" name="val" placeholder="R$ 200,00" defaultValue="R$ 200,00" />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsNewModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Criar Sessão</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
