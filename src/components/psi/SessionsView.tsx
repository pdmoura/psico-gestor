import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, ChevronLeft, ChevronRight, Clock, MapPin, Trash2, CalendarClock, Search } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "./StatusBadge";
import { Modal } from "./Modal";
import { FormInput } from "./FormInput";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from "@/components/ui/command";

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

interface PatientOption {
  id: string;
  name: string;
  session_value: number | null;
  fixed_schedule: string | null;
}

const today = new Date();

export const SessionsView = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionRow | null>(null);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today, { weekStartsOn: 1 }));
  const [newDate, setNewDate] = useState<Date | undefined>(undefined);
  const [newHourDefault, setNewHourDefault] = useState<number | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  // Auto-fill from patient
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [autoValue, setAutoValue] = useState("200");
  const [autoTime, setAutoTime] = useState("");

  // Patient search popover
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);

  // Bulk select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Day detail dialog
  const [dayDetailDate, setDayDetailDate] = useState<Date | null>(null);

  // Reschedule
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(undefined);
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleSessionId, setRescheduleSessionId] = useState<string | null>(null);

  // Single delete confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);

  const fetchData = async () => {
    const [sessRes, patRes] = await Promise.all([
      supabase.from("sessions").select("*, patients(name)").order("date", { ascending: true }),
      supabase.from("patients").select("id, name, session_value, fixed_schedule").eq("status", "Ativo").order("name"),
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

  const handlePatientChange = useCallback((patientId: string) => {
    setSelectedPatientId(patientId);
    const pat = patients.find(p => p.id === patientId);
    if (pat) {
      setAutoValue(String(pat.session_value ?? 200));
      if (pat.fixed_schedule) {
        const match = pat.fixed_schedule.match(/(\d{1,2}):(\d{2})/);
        if (match) setAutoTime(`${match[1].padStart(2, "0")}:${match[2]}`);
      } else {
        setAutoTime(newHourDefault ? `${String(newHourDefault).padStart(2, "0")}:00` : "");
      }
    } else {
      setAutoValue("200");
      setAutoTime("");
    }
  }, [patients, newHourDefault]);

  const selectedPatientName = useMemo(() => {
    const pat = patients.find(p => p.id === selectedPatientId);
    return pat?.name || "";
  }, [patients, selectedPatientId]);

  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  const getSessionsAt = (day: Date, hour: number) =>
    sessions.filter(s => isSameDay(s.date, day) && s.hour === hour);

  const getSessionsForDay = (day: Date) =>
    sessions.filter(s => isSameDay(s.date, day)).sort((a, b) => a.hour - b.hour);

  const getStatusColor = (status: string) => {
    if (status === "Realizado") return { bg: "bg-[hsl(var(--status-success-bg))]", border: "border-[hsl(var(--status-success-border))]" };
    if (status === "Cancelado") return { bg: "bg-[hsl(var(--status-neutral-bg))]", border: "border-[hsl(var(--status-neutral-border))]" };
    return { bg: "bg-[hsl(var(--status-info-bg))]", border: "border-[hsl(var(--status-info-border))]" };
  };

  const openNewSession = (date?: Date, hour?: number) => {
    setNewDate(date || undefined);
    setNewHourDefault(hour);
    setSelectedPatientId("");
    setAutoValue("200");
    setAutoTime(hour ? `${String(hour).padStart(2, "0")}:00` : "");
    setIsNewModalOpen(true);
  };

  const handleCreateSession = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !newDate || !selectedPatientId) {
      if (!selectedPatientId) toast.error("Selecione um paciente");
      return;
    }
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const time = fd.get("time") as string;
    const type = fd.get("type") as string;
    const value = parseInt(fd.get("val") as string) || 200;
    const hourNum = parseInt(time.split(":")[0]);
    const endHour = `${String(hourNum + 1).padStart(2, "0")}:${time.split(":")[1] || "00"}`;

    const { error } = await supabase.from("sessions").insert({
      user_id: user.id, patient_id: selectedPatientId, date: format(newDate, "yyyy-MM-dd"),
      start_time: time, end_time: endHour, type, value,
    });

    if (!error) {
      await supabase.from("transactions").insert({
        user_id: user.id, patient_id: selectedPatientId, date: format(newDate, "yyyy-MM-dd"), value,
      });
    }

    setSaving(false);
    if (error) { toast.error("Erro ao criar sessão"); return; }
    toast.success("Sessão criada!");
    setIsNewModalOpen(false);
    setNewDate(undefined);
    setNewHourDefault(undefined);
    setDayDetailDate(null);
    fetchData();
  };

  const updateSessionStatus = async (sessionId: string, status: string, paymentStatus?: string) => {
    const update: any = { status };
    if (paymentStatus) update.payment_status = paymentStatus;
    const { error } = await supabase.from("sessions").update(update).eq("id", sessionId);
    if (error) { toast.error("Erro ao atualizar"); return; }

    if (paymentStatus) {
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        await supabase.from("transactions").update({ status: paymentStatus }).eq("patient_id", session.patient_id).eq("date", format(session.date, "yyyy-MM-dd"));
      }
    }

    toast.success("Sessão atualizada!");
    setIsModalOpen(false);
    fetchData();
  };

  const handleDeleteSession = async (id: string) => {
    await supabase.from("transactions").delete().eq("session_id", id);
    const { error } = await supabase.from("sessions").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir sessão"); return; }
    toast.success("Sessão excluída!");
    setShowDeleteConfirm(false);
    setDeleteSessionId(null);
    setIsModalOpen(false);
    fetchData();
  };

  const handleReschedule = async () => {
    if (!rescheduleSessionId || !rescheduleDate || !rescheduleTime) return;
    const hourNum = parseInt(rescheduleTime.split(":")[0]);
    const endHour = `${String(hourNum + 1).padStart(2, "0")}:${rescheduleTime.split(":")[1] || "00"}`;
    const { error } = await supabase.from("sessions").update({
      date: format(rescheduleDate, "yyyy-MM-dd"),
      start_time: rescheduleTime,
      end_time: endHour,
    }).eq("id", rescheduleSessionId);
    if (error) { toast.error("Erro ao reagendar"); return; }
    toast.success("Sessão reagendada!");
    setShowReschedule(false);
    setRescheduleSessionId(null);
    setIsModalOpen(false);
    fetchData();
  };

  // Bulk
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sessions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sessions.map(s => s.id)));
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    await supabase.from("transactions").delete().in("session_id", ids);
    const { error } = await supabase.from("sessions").delete().in("id", ids);
    if (error) { toast.error("Erro ao excluir sessões"); return; }
    toast.success(`${ids.length} sessão(ões) excluída(s)`);
    setSelectedIds(new Set());
    setShowBulkDeleteConfirm(false);
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

  const dayDetailSessions = dayDetailDate ? getSessionsForDay(dayDetailDate) : [];
  const hasBulk = selectedIds.size > 0;

  if (loading) return <div className="flex items-center justify-center py-16 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">Agenda de Sessões</h2>
        <Button className="gap-2" onClick={() => openNewSession()}><Plus size={16} /> Nova Sessão</Button>
      </div>

      {/* Reserved bulk actions bar */}
      <div className="min-h-[40px] flex flex-wrap items-center gap-2">
        {hasBulk ? (
          <>
            <Checkbox
              checked={selectedIds.size === sessions.length}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {selectedIds.size} selecionada(s)
            </span>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs sm:text-sm text-[hsl(var(--archive-action))] border-[hsl(var(--archive-action))] hover:bg-[hsl(var(--archive-action))]/10"
              onClick={() => setShowBulkDeleteConfirm(true)}
            >
              <Trash2 size={14} /> Excluir ({selectedIds.size})
            </Button>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">Selecione sessões para ações em lote</span>
        )}
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
            <button key={i}
              onClick={() => setDayDetailDate(day)}
              className={`px-3 py-3 text-xs font-medium text-center hover:bg-muted/50 transition-colors ${isSameDay(day, today) ? "text-primary font-bold" : "text-muted-foreground"}`}>
              <div>{format(day, "EEE", { locale: ptBR })}</div>
              <div>{format(day, "dd/MM")}</div>
            </button>
          ))}
        </div>
        <div className="max-h-[500px] overflow-y-auto">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-[80px_repeat(5,1fr)] border-b border-border last:border-0 min-h-[60px]">
              <div className="px-3 py-2 text-xs text-muted-foreground border-r border-border flex items-start pt-3">{hour}:00</div>
              {weekDays.map((day, di) => {
                const cellSessions = getSessionsAt(day, hour);
                return (
                  <div key={di}
                    className={`border-r border-border last:border-r-0 relative p-1 cursor-pointer hover:bg-muted/30 transition-colors ${isSameDay(day, today) ? "bg-primary/[0.02]" : ""}`}
                    onClick={() => {
                      if (cellSessions.length === 0) openNewSession(day, hour);
                      else if (cellSessions.length === 1) { setSelectedSession(cellSessions[0]); setIsModalOpen(true); }
                      else setDayDetailDate(day);
                    }}>
                    {cellSessions.length === 0 ? null : cellSessions.length === 1 ? (
                      (() => {
                        const session = cellSessions[0];
                        const colors = getStatusColor(session.status);
                        return (
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedSession(session); setIsModalOpen(true); }}
                            className={`w-full h-[52px] ${colors.bg} border-l-4 ${colors.border} rounded p-2 text-left hover:shadow-md transition-all`}>
                            <p className="text-xs font-semibold text-foreground truncate">{session.patient_name}</p>
                            <p className="text-[10px] text-muted-foreground">{session.start_time} - {session.end_time}</p>
                          </button>
                        );
                      })()
                    ) : (
                      <div className="flex flex-col gap-0.5 h-full">
                        {cellSessions.slice(0, 2).map((session) => {
                          const colors = getStatusColor(session.status);
                          return (
                            <button key={session.id}
                              onClick={(e) => { e.stopPropagation(); setSelectedSession(session); setIsModalOpen(true); }}
                              className={`w-full ${colors.bg} border-l-4 ${colors.border} rounded px-1.5 py-0.5 text-left hover:shadow-md transition-all`}>
                              <p className="text-[10px] font-semibold text-foreground truncate">{session.patient_name}</p>
                            </button>
                          );
                        })}
                        {cellSessions.length > 2 && (
                          <span className="text-[10px] text-muted-foreground text-center">+{cellSessions.length - 2} mais</span>
                        )}
                      </div>
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
                <div key={s.id} className={cn(
                  "w-full bg-card border border-border rounded-xl p-4 text-left shadow-sm transition-all",
                  selectedIds.has(s.id) && "ring-2 ring-primary"
                )}>
                  <div className="flex items-start gap-3">
                    <div className="pt-0.5">
                      <Checkbox
                        checked={selectedIds.has(s.id)}
                        onCheckedChange={() => toggleSelect(s.id)}
                      />
                    </div>
                    <button
                      onClick={() => { setSelectedSession(s); setIsModalOpen(true); }}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-foreground">{s.patient_name}</span>
                        <StatusBadge status={s.status} />
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="space-y-1">
                          <p className="flex items-center gap-1.5"><Clock size={14} /> {s.start_time} - {s.end_time}</p>
                          <p className="flex items-center gap-1.5"><MapPin size={14} /> {s.type}</p>
                        </div>
                        <span className="text-foreground font-medium">R$ {s.value}</span>
                      </div>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Day Detail Dialog */}
      <Dialog open={!!dayDetailDate} onOpenChange={(open) => !open && setDayDetailDate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dayDetailDate && format(dayDetailDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </DialogTitle>
            <DialogDescription>
              {dayDetailSessions.length === 0 ? "Nenhuma sessão agendada para este dia." : `${dayDetailSessions.length} sessão(ões) agendada(s).`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {dayDetailSessions.map((s) => {
              const colors = getStatusColor(s.status);
              return (
                <button key={s.id}
                  onClick={() => { setDayDetailDate(null); setSelectedSession(s); setIsModalOpen(true); }}
                  className={`w-full ${colors.bg} border-l-4 ${colors.border} rounded-lg p-3 text-left hover:shadow-md transition-all`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-foreground">{s.patient_name}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock size={12} /> {s.start_time} - {s.end_time}</span>
                    <span className="flex items-center gap-1"><MapPin size={12} /> {s.type}</span>
                    <span>R$ {s.value}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <DialogFooter>
            <Button onClick={() => { setDayDetailDate(null); openNewSession(dayDetailDate!, undefined); }} className="gap-2">
              <Plus size={14} /> Nova Sessão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  <Button variant="outline" className="gap-1.5" onClick={() => {
                    setRescheduleSessionId(selectedSession.id);
                    setRescheduleDate(selectedSession.date);
                    setRescheduleTime(selectedSession.start_time);
                    setShowReschedule(true);
                  }}>
                    <CalendarClock size={14} /> Reagendar
                  </Button>
                </>
              )}
              {selectedSession.payment_status === "Pendente" && (
                <Button onClick={() => updateSessionStatus(selectedSession.id, selectedSession.status, "Pago")}>Registrar Pagamento</Button>
              )}
              <Button
                variant="outline"
                className="gap-1.5 text-[hsl(var(--archive-action))] border-[hsl(var(--archive-action))] hover:bg-[hsl(var(--archive-action))]/10"
                onClick={() => { setDeleteSessionId(selectedSession.id); setShowDeleteConfirm(true); }}
              >
                <Trash2 size={14} /> Excluir
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reschedule Dialog */}
      <Dialog open={showReschedule} onOpenChange={setShowReschedule}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reagendar Sessão</DialogTitle>
            <DialogDescription>Selecione a nova data e horário.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Nova data</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !rescheduleDate && "text-muted-foreground")}>
                    {rescheduleDate ? format(rescheduleDate, "dd/MM/yyyy (EEEE)", { locale: ptBR }) : "Selecionar data..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={rescheduleDate} onSelect={setRescheduleDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
            <FormInput label="Novo horário" id="reschedule-time" name="reschedule_time" type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} required />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleReschedule} disabled={!rescheduleDate || !rescheduleTime}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single Delete Confirm */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir sessão</DialogTitle>
            <DialogDescription>Tem certeza que deseja excluir esta sessão? Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button
              className="bg-[hsl(var(--archive-action))] text-[hsl(var(--archive-action-foreground))] hover:bg-[hsl(var(--archive-action-hover))]"
              onClick={() => deleteSessionId && handleDeleteSession(deleteSessionId)}
            >
              <Trash2 size={14} className="mr-1.5" /> Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Session Modal */}
      <Modal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} title="Nova Sessão">
        <form onSubmit={handleCreateSession} className="space-y-4">
          {/* Searchable patient selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Paciente</label>
            <Popover open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={patientSearchOpen}
                  className={cn("w-full justify-between font-normal", !selectedPatientId && "text-muted-foreground")}
                >
                  {selectedPatientName || "Buscar paciente..."}
                  <Search size={14} className="ml-2 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] max-w-[calc(100vw-4rem)] p-0 overflow-hidden" align="start" sideOffset={4}>
                <Command className="max-h-60">
                  <CommandInput placeholder="Buscar por nome..." className="h-9 [&:focus-visible]:outline-none [&:focus-visible]:ring-0 [&:focus-visible]:ring-offset-0" />
                  <CommandList className="max-h-40 overflow-y-auto">
                    <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>
                    <CommandGroup>
                      {patients.map(p => (
                        <CommandItem
                          key={p.id}
                          value={p.name}
                          onSelect={() => {
                            handlePatientChange(p.id);
                            setPatientSearchOpen(false);
                          }}
                        >
                          <span className={cn("flex-1", selectedPatientId === p.id && "font-semibold")}>{p.name}</span>
                          {p.session_value && (
                            <span className="text-xs text-muted-foreground">R$ {p.session_value}</span>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
          <FormInput label="Horário" id="new-time" name="time" type="time" value={autoTime} onChange={(e) => setAutoTime(e.target.value)} required />
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Modalidade</label>
            <select name="type" className="w-full h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-ring focus:outline-none">
              <option value="Online">Online</option>
              <option value="Presencial">Presencial</option>
            </select>
          </div>
          <FormInput label="Valor" id="new-val" name="val" type="number" placeholder="200" value={autoValue} onChange={(e) => setAutoValue(e.target.value)} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsNewModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? "Criando..." : "Criar Sessão"}</Button>
          </div>
        </form>
      </Modal>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir {selectedIds.size} sessão(ões)? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button
              className="bg-[hsl(var(--archive-action))] text-[hsl(var(--archive-action-foreground))] hover:bg-[hsl(var(--archive-action-hover))]"
              onClick={handleBulkDelete}
            >
              <Trash2 size={14} className="mr-1.5" /> Excluir sessões
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
