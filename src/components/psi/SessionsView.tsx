import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StatusBadge } from "./StatusBadge";
import { Modal } from "./Modal";
import { FormInput } from "./FormInput";
import { cn } from "@/lib/utils";

interface Session {
  id: number;
  patient: string;
  date: Date;
  time: string;
  status: string;
  type: string;
  val: string;
  payment: string;
  hour: number;
}

const today = new Date();

const initialSessions: Session[] = [
  { id: 1, patient: "Alice Guimarães", date: today, time: "14:00 - 14:50", status: "Agendado", type: "Online", val: "R$ 200,00", payment: "Pendente", hour: 14 },
  { id: 2, patient: "Bruno Costa", date: today, time: "15:30 - 16:20", status: "Realizado", type: "Presencial", val: "R$ 180,00", payment: "Pago", hour: 15 },
  { id: 3, patient: "Carla Dias", date: addDays(today, 1), time: "10:00 - 10:50", status: "Agendado", type: "Online", val: "R$ 250,00", payment: "Pendente", hour: 10 },
  { id: 4, patient: "Fernanda Lima", date: today, time: "09:00 - 09:50", status: "Realizado", type: "Online", val: "R$ 200,00", payment: "Pago", hour: 9 },
  { id: 5, patient: "Pedro Henrique", date: addDays(today, 1), time: "14:00 - 14:50", status: "Agendado", type: "Presencial", val: "R$ 250,00", payment: "Pendente", hour: 14 },
  { id: 6, patient: "Juliana Martins", date: addDays(today, 2), time: "11:00 - 11:50", status: "Agendado", type: "Online", val: "R$ 200,00", payment: "Pendente", hour: 11 },
  { id: 7, patient: "Rafael Almeida", date: addDays(today, 3), time: "16:00 - 16:50", status: "Agendado", type: "Online", val: "R$ 180,00", payment: "Pendente", hour: 16 },
  { id: 8, patient: "Luiza Ferreira", date: addDays(today, 4), time: "10:00 - 10:50", status: "Agendado", type: "Presencial", val: "R$ 250,00", payment: "Pendente", hour: 10 },
  { id: 9, patient: "Marília Santos", date: addDays(today, -1), time: "16:00 - 16:50", status: "Realizado", type: "Online", val: "R$ 180,00", payment: "Pago", hour: 16 },
];

export const SessionsView = () => {
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today, { weekStartsOn: 1 }));
  const [newDate, setNewDate] = useState<Date | undefined>(undefined);
  const [newHourDefault, setNewHourDefault] = useState<number | undefined>(undefined);

  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  const getSessionAt = (day: Date, hour: number) =>
    sessions.find(s => isSameDay(s.date, day) && s.hour === hour);

  const getStatusColor = (status: string) => {
    if (status === "Realizado") return { bg: "bg-[hsl(var(--status-success-bg))]", border: "border-[hsl(var(--status-success-border))]" };
    if (status === "Cancelado") return { bg: "bg-[hsl(var(--status-neutral-bg))]", border: "border-[hsl(var(--status-neutral-border))]" };
    return { bg: "bg-[hsl(var(--status-info-bg))]", border: "border-[hsl(var(--status-info-border))]" };
  };

  const openNewSession = (date?: Date, hour?: number) => {
    setNewDate(date || undefined);
    setNewHourDefault(hour);
    setIsNewModalOpen(true);
  };

  const handleCreateSession = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const patient = fd.get("patient") as string;
    const time = fd.get("time") as string;
    const type = fd.get("type") as string;
    const val = fd.get("val") as string;

    if (!patient || !time || !newDate) return;

    const hourNum = Number(time.split(":")[0]);
    const endHour = String(hourNum + 1).padStart(2, "0");
    const newSession: Session = {
      id: Date.now(),
      patient,
      date: newDate,
      time: `${time} - ${endHour}:${time.split(":")[1] || "00"}`,
      status: "Agendado",
      type: type || "Online",
      val: val || "R$ 200,00",
      payment: "Pendente",
      hour: hourNum,
    };
    setSessions(prev => [...prev, newSession]);
    setIsNewModalOpen(false);
    setNewDate(undefined);
    setNewHourDefault(undefined);
  };

  // Group sessions by date for mobile view
  const groupedSessions = sessions
    .filter(s => s.date >= addDays(today, -1))
    .sort((a, b) => a.date.getTime() - b.date.getTime() || a.hour - b.hour)
    .reduce<Record<string, Session[]>>((acc, s) => {
      const key = format(s.date, "yyyy-MM-dd");
      if (!acc[key]) acc[key] = [];
      acc[key].push(s);
      return acc;
    }, {});

  const formatDayLabel = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    if (isSameDay(d, today)) return "Hoje";
    if (isSameDay(d, addDays(today, 1))) return "Amanhã";
    if (isSameDay(d, addDays(today, -1))) return "Ontem";
    return format(d, "EEEE, dd/MM", { locale: ptBR });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">Agenda de Sessões</h2>
        <Button className="gap-2" onClick={() => openNewSession()}>
          <Plus size={16} /> Nova Sessão
        </Button>
      </div>

      {/* Week navigation */}
      <div className="flex items-center gap-3">
        <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft size={18} className="text-muted-foreground" />
        </button>
        <span className="text-sm font-medium text-foreground">
          {format(weekStart, "dd MMM", { locale: ptBR })} – {format(addDays(weekStart, 4), "dd MMM yyyy", { locale: ptBR })}
        </span>
        <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ChevronRight size={18} className="text-muted-foreground" />
        </button>
        <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(today, { weekStartsOn: 1 }))}>Hoje</Button>
      </div>

      {/* Desktop Calendar */}
      <div className="hidden lg:block bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-[80px_repeat(5,1fr)] border-b border-border bg-muted/50">
          <div className="px-3 py-3 text-xs font-medium text-muted-foreground">Horário</div>
          {weekDays.map((day, i) => (
            <div key={i} className={`px-3 py-3 text-xs font-medium text-center ${isSameDay(day, today) ? "text-primary font-bold" : "text-muted-foreground"}`}>
              <div>{format(day, "EEE", { locale: ptBR })}</div>
              <div>{format(day, "dd/MM")}</div>
            </div>
          ))}
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-[80px_repeat(5,1fr)] border-b border-border last:border-0 min-h-[60px]">
              <div className="px-3 py-2 text-xs text-muted-foreground border-r border-border flex items-start pt-3">
                {hour}:00
              </div>
              {weekDays.map((day, di) => {
                const session = getSessionAt(day, hour);
                const colors = session ? getStatusColor(session.status) : null;
                return (
                  <div
                    key={di}
                    className={`border-r border-border last:border-r-0 relative p-1 cursor-pointer hover:bg-muted/30 transition-colors ${isSameDay(day, today) ? "bg-primary/[0.02]" : ""}`}
                    onDoubleClick={() => !session && openNewSession(day, hour)}
                  >
                    {session && (
                      <button
                        onClick={() => { setSelectedSession(session); setIsModalOpen(true); }}
                        className={`w-full h-[52px] ${colors!.bg} border-l-4 ${colors!.border} rounded p-2 text-left hover:shadow-md transition-all`}
                      >
                        <p className="text-xs font-semibold text-foreground truncate">{session.patient}</p>
                        <p className="text-[10px] text-muted-foreground">{session.time}</p>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile List */}
      <div className="lg:hidden space-y-4">
        {Object.entries(groupedSessions).map(([dateKey, daySessions]) => (
          <div key={dateKey}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">{formatDayLabel(dateKey)}</h3>
            <div className="space-y-3">
              {daySessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedSession(s); setIsModalOpen(true); }}
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
        ))}
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
                <p className="text-muted-foreground text-xs mb-1">Data</p>
                <p className="font-medium text-foreground">{format(selectedSession.date, "dd/MM/yyyy")}</p>
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
                <p className="text-muted-foreground text-xs mb-1">Pagamento</p>
                <StatusBadge status={selectedSession.payment} />
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground text-xs mb-1">Status</p>
                <StatusBadge status={selectedSession.status} />
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

          {/* Date picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Data da sessão</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !newDate && "text-muted-foreground")}
                >
                  {newDate ? format(newDate, "dd/MM/yyyy (EEEE)", { locale: ptBR }) : "Selecionar data..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newDate}
                  onSelect={setNewDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <FormInput
            label="Horário"
            id="new-time"
            name="time"
            type="time"
            defaultValue={newHourDefault ? `${String(newHourDefault).padStart(2, "0")}:00` : ""}
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
