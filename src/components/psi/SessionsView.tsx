import { useState, useEffect } from "react";
import { Plus, ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StatusBadge } from "./StatusBadge";
import { Modal } from "./Modal";
import { FormInput } from "./FormInput";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface SessionRow {
  id: string;
  patient_id: string;
  patient_name: string;
  date: Date;
  start_time: string;
  end_time: string;
  status: string;
  type: string;
  value: number;
  payment_status: string;
  hour: number;
}

const today = new Date();

export const SessionsView = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [patients, setPatients] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionRow | null>(null);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today, { weekStartsOn: 1 }));
  const [newDate, setNewDate] = useState<Date | undefined>(undefined);
  const [newHourDefault, setNewHourDefault] = useState<number | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    const [sessRes, patRes] = await Promise.all([
      supabase.from("sessions").select("*, patients(name)").order("date", { ascending: true }),
      supabase.from("patients").select("id, name").eq("status", "Ativo").order("name"),
    ]);
    if (sessRes.data) {
      setSessions(sessRes.data.map((s: any) => ({
        id: s.id,
        patient_id: s.patient_id,
        patient_name: s.patients?.name || "—",
        date: parseISO(s.date),
        start_time: s.start_time,
        end_time: s.end_time,
        status: s.status,
        type: s.type,
        value: s.value,
        payment_status: s.payment_status,
        hour: parseInt(s.start_time.split(":")[0]),
      })));
    }
    if (patRes.data) setPatients(patRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

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

  const handleCreateSession = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !newDate) return;
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const patient_id = fd.get("patient_id") as string;
    const time = fd.get("time") as string;
    const type = fd.get("type") as string;
    const value = parseInt(fd.get("val") as string) || 200;
    const hourNum = parseInt(time.split(":")[0]);
    const endHour = `${String(hourNum + 1).padStart(2, "0")}:${time.split(":")[1] || "00"}`;

    const { error } = await supabase.from("sessions").insert({
      user_id: user.id,
      patient_id,
      date: format(newDate, "yyyy-MM-dd"),
      start_time: time,
      end_time: endHour,
      type,
      value,
    });

    // Also create a pending transaction
    if (!error) {
      await supabase.from("transactions").insert({
        user_id: user.id,
        patient_id,
        date: format(newDate, "yyyy-MM-dd"),
        value,
      });
    }

    setSaving(false);
    if (error) { toast.error("Erro ao criar sessão"); return; }
    toast.success("Sessão criada!");
    setIsNewModalOpen(false);
    setNewDate(undefined);
    setNewHourDefault(undefined);
    fetchData();
  };

  const updateSessionStatus = async (sessionId: string, status: string, paymentStatus?: string) => {
    const update: any = { status };
    if (paymentStatus) update.payment_status = paymentStatus;
    const { error } = await supabase.from("sessions").update(update).eq("id", sessionId);
    if (error) { toast.error("Erro ao atualizar"); return; }

    if (paymentStatus) {
      // Update corresponding transaction
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        await supabase.from("transactions").update({ status: paymentStatus }).eq("patient_id", session.patient_id).eq("date", format(session.date, "yyyy-MM-dd"));
      }
    }

    toast.success("Sessão atualizada!");
    setIsModalOpen(false);
    fetchData();
  };

  const groupedSessions = sessions
    .filter(s => s.date >= addDays(today, -1))
    .sort((a, b) => a.date.getTime() - b.date.getTime() || a.hour - b.hour)
    .reduce<Record<string, SessionRow[]>>((acc, s) => {
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

  if (loading) return <div className="flex items-center justify-center py-16 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">Agenda de Sessões</h2>
        <Button className="gap-2" onClick={() => openNewSession()}><Plus size={16} /> Nova Sessão</Button>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="p-2 rounded-lg hover:bg-muted transition-colors"><ChevronLeft size={18} className="text-muted-foreground" /></button>
        <span className="text-sm font-medium text-foreground">{format(weekStart, "dd MMM", { locale: ptBR })} – {format(addDays(weekStart, 4), "dd MMM yyyy", { locale: ptBR })}</span>
        <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="p-2 rounded-lg hover:bg-muted transition-colors"><ChevronRight size={18} className="text-muted-foreground" /></button>
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
              <div className="px-3 py-2 text-xs text-muted-foreground border-r border-border flex items-start pt-3">{hour}:00</div>
              {weekDays.map((day, di) => {
                const session = getSessionAt(day, hour);
                const colors = session ? getStatusColor(session.status) : null;
                return (
                  <div key={di} className={`border-r border-border last:border-r-0 relative p-1 cursor-pointer hover:bg-muted/30 transition-colors ${isSameDay(day, today) ? "bg-primary/[0.02]" : ""}`}
                    onDoubleClick={() => !session && openNewSession(day, hour)}>
                    {session && (
                      <button onClick={() => { setSelectedSession(session); setIsModalOpen(true); }}
                        className={`w-full h-[52px] ${colors!.bg} border-l-4 ${colors!.border} rounded p-2 text-left hover:shadow-md transition-all`}>
                        <p className="text-xs font-semibold text-foreground truncate">{session.patient_name}</p>
                        <p className="text-[10px] text-muted-foreground">{session.start_time} - {session.end_time}</p>
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
        {Object.keys(groupedSessions).length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">Nenhuma sessão agendada.</div>
        )}
        {Object.entries(groupedSessions).map(([dateKey, daySessions]) => (
          <div key={dateKey}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">{formatDayLabel(dateKey)}</h3>
            <div className="space-y-3">
              {daySessions.map((s) => (
                <button key={s.id} onClick={() => { setSelectedSession(s); setIsModalOpen(true); }}
                  className="w-full bg-card border border-border rounded-xl p-4 text-left shadow-sm active:scale-[0.98] transition-transform">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground">{s.patient_name}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="space-y-1">
                      <p>🕒 {s.start_time} - {s.end_time}</p>
                      <p>📍 {s.type}</p>
                    </div>
                    <span className="text-foreground font-medium">R$ {s.value}</span>
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
              <div><p className="text-muted-foreground text-xs mb-1">Paciente</p><p className="font-medium text-foreground">{selectedSession.patient_name}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Data</p><p className="font-medium text-foreground">{format(selectedSession.date, "dd/MM/yyyy")}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Horário</p><p className="font-medium text-foreground">{selectedSession.start_time} - {selectedSession.end_time}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Modalidade</p><p className="font-medium text-foreground">{selectedSession.type}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Valor</p><p className="font-medium text-foreground">R$ {selectedSession.value}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Pagamento</p><StatusBadge status={selectedSession.payment_status} /></div>
              <div className="col-span-2"><p className="text-muted-foreground text-xs mb-1">Status</p><StatusBadge status={selectedSession.status} /></div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              {selectedSession.status === "Agendado" && (
                <>
                  <Button variant="outline" onClick={() => updateSessionStatus(selectedSession.id, "Cancelado", "Cancelado")}>Cancelar Sessão</Button>
                  <Button variant="outline" onClick={() => updateSessionStatus(selectedSession.id, "Realizado")}>Marcar Realizada</Button>
                </>
              )}
              {selectedSession.payment_status === "Pendente" && (
                <Button onClick={() => updateSessionStatus(selectedSession.id, selectedSession.status, "Pago")}>Registrar Pagamento</Button>
              )}
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Fechar</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* New Session Modal */}
      <Modal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} title="Nova Sessão">
        <form onSubmit={handleCreateSession} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Paciente</label>
            <select name="patient_id" required className="h-11 px-3 text-sm bg-card border-2 border-border rounded-lg text-foreground focus:border-ring focus:outline-none">
              <option value="">Selecionar paciente...</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Data da sessão</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newDate && "text-muted-foreground")}>
                  {newDate ? format(newDate, "dd/MM/yyyy (EEEE)", { locale: ptBR }) : "Selecionar data..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={newDate} onSelect={setNewDate} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>

          <FormInput label="Horário" id="new-time" name="time" type="time" defaultValue={newHourDefault ? `${String(newHourDefault).padStart(2, "0")}:00` : ""} required />
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Modalidade</label>
            <select name="type" className="w-full h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-ring focus:outline-none">
              <option value="Online">Online</option>
              <option value="Presencial">Presencial</option>
            </select>
          </div>
          <FormInput label="Valor" id="new-val" name="val" type="number" placeholder="200" defaultValue="200" />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsNewModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? "Criando..." : "Criar Sessão"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
