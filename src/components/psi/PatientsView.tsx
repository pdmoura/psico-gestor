import { useState, useEffect } from "react";
import { Search, Edit2, Trash2, Plus, Users, Phone, DollarSign, Clock, ToggleLeft, ToggleRight, Mail, FileText, ChevronDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "./StatusBadge";
import { Modal } from "./Modal";
import { FormInput } from "./FormInput";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
);

const GoogleDriveIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <path fill="#1e88e5" d="M38.59,39c-0.535,0.93-0.298,1.68-1.195,2.197C36.498,41.715,35.465,42,34.39,42H13.61c-1.074,0-2.106-0.285-3.004-0.802C9.708,40.681,9.945,39.93,9.41,39l7.67-9h13.84L38.59,39z" />
    <path fill="#fbc02d" d="M27.463,6.999c1.073-0.002,2.104-0.716,3.001-0.198c0.897,0.519,1.66,1.27,2.197,2.201l10.39,17.996c0.537,0.93,0.807,1.967,0.808,3.002c0.001,1.037-1.267,2.073-1.806,3.001l-11.127-3.005l-6.924-11.993L27.463,6.999z" />
    <path fill="#e53935" d="M43.86,30c0,1.04-0.27,2.07-0.81,3l-3.67,6.35c-0.53,0.78-1.21,1.4-1.99,1.85L30.92,30H43.86z" />
    <path fill="#4caf50" d="M5.947,33.001c-0.538-0.928-1.806-1.964-1.806-3c0.001-1.036,0.27-2.073,0.808-3.004l10.39-17.996c0.537-0.93,1.3-1.682,2.196-2.2c0.897-0.519,1.929,0.195,3.002,0.197l3.459,11.009l-6.922,11.989L5.947,33.001z" />
    <path fill="#1565c0" d="M17.08,30l-6.47,11.2c-0.78-0.45-1.46-1.07-1.99-1.85L4.95,33c-0.54-0.93-0.81-1.96-0.81-3H17.08z" />
    <path fill="#2e7d32" d="M30.46,6.8L24,18L17.53,6.8c0.78-0.45,1.66-0.73,2.6-0.79L27.46,6C28.54,6,29.57,6.28,30.46,6.8z" />
  </svg>
);

type Patient = Tables<"patients">;

export const PatientsView = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePatientId, setDeletePatientId] = useState<string | null>(null);
  const [viewPatient, setViewPatient] = useState<Patient | null>(null);

  const getWhatsAppUrl = (phone: string, text?: string) => {
    const digits = phone.replace(/\D/g, "");
    const number = digits.startsWith("55") ? digits : `55${digits}`;
    const base = `https://wa.me/${number}`;
    return text ? `${base}?text=${encodeURIComponent(text)}` : base;
  };

  const getMessageTemplates = (patientName: string) => [
    {
      label: "Confirmação + Pagamento",
      text: `Olá, ${patientName}! \n\nTemos uma sessão agendada para hoje às (horário_sessão). \n\nComo a confirmação depende do pagamento prévio referente ao pacote que iniciaremos hoje, reencaminho, abaixo, dados para pagamento. \n\nAté breve! 🤎`,
    },
    {
      label: "Lembrete de sessão",
      text: `Olá, ${patientName}! \n\nPassando para lembrar da nossa sessão agendada. \n\nAté breve! 🤎`,
    },
    {
      label: "Reagendamento",
      text: `Olá, ${patientName}! \n\nPreciso reagendar nossa próxima sessão. Podemos combinar um novo horário? \n\nAguardo seu retorno! 🤎`,
    },
  ];

  const fetchPatients = async () => {
    const { data, error } = await supabase.from("patients").select("*").order("name");
    if (error) { toast.error("Erro ao carregar pacientes"); return; }
    setPatients(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchPatients(); }, []);

  const filtered = patients.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const openEditModal = (patient: Patient | null) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get("name") as string,
      phone: fd.get("phone") as string,
      email: fd.get("email") as string,
      session_value: parseInt(fd.get("session_value") as string) || 200,
      fixed_schedule: fd.get("fixed_schedule") as string,
      status: fd.get("status") as string,
      notes: fd.get("notes") as string,
      user_id: user.id,
    };

    if (selectedPatient) {
      const { error } = await supabase.from("patients").update(payload).eq("id", selectedPatient.id);
      if (error) { toast.error("Erro ao atualizar"); setSaving(false); return; }
      toast.success("Paciente atualizado!");
    } else {
      const { error } = await supabase.from("patients").insert(payload);
      if (error) { toast.error("Erro ao criar paciente"); setSaving(false); return; }
      toast.success("Paciente cadastrado!");
    }
    setSaving(false);
    setIsModalOpen(false);
    fetchPatients();
  };

  const handleToggleStatus = async (patient: Patient) => {
    const newStatus = patient.status === "Ativo" ? "Inativo" : "Ativo";
    const { error } = await supabase.from("patients").update({ status: newStatus }).eq("id", patient.id);
    if (error) { toast.error("Erro ao alterar status"); return; }
    toast.success(newStatus === "Inativo" ? "Paciente desativado" : "Paciente ativado");
    fetchPatients();
  };

  const handleDeletePatient = async (id: string) => {
    const { data: patientSessions } = await supabase.from("sessions").select("id").eq("patient_id", id);
    if (patientSessions && patientSessions.length > 0) {
      const sessionIds = patientSessions.map(s => s.id);
      await supabase.from("transactions").delete().in("session_id", sessionIds);
      await supabase.from("sessions").delete().eq("patient_id", id);
    }
    await supabase.from("transactions").delete().eq("patient_id", id);
    const { error } = await supabase.from("patients").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir paciente"); return; }
    toast.success("Paciente excluído!");
    setShowDeleteConfirm(false);
    setDeletePatientId(null);
    fetchPatients();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(p => p.id)));
    }
  };

  // Check if all selected are active or inactive for bulk toggle
  const selectedPatients = filtered.filter(p => selectedIds.has(p.id));
  const allSelectedActive = selectedPatients.every(p => p.status === "Ativo");
  const bulkToggleLabel = allSelectedActive ? "Desativar" : "Ativar";
  const bulkToggleNewStatus = allSelectedActive ? "Inativo" : "Ativo";

  const handleBulkToggle = async () => {
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from("patients").update({ status: bulkToggleNewStatus }).in("id", ids);
    if (error) { toast.error("Erro ao alterar status"); return; }
    toast.success(`${ids.length} paciente(s) ${bulkToggleNewStatus === "Inativo" ? "desativado(s)" : "ativado(s)"}`);
    setSelectedIds(new Set());
    
    fetchPatients();
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      const { data: patientSessions } = await supabase.from("sessions").select("id").eq("patient_id", id);
      if (patientSessions && patientSessions.length > 0) {
        const sessionIds = patientSessions.map(s => s.id);
        await supabase.from("transactions").delete().in("session_id", sessionIds);
        await supabase.from("sessions").delete().eq("patient_id", id);
      }
      await supabase.from("transactions").delete().eq("patient_id", id);
    }
    const { error } = await supabase.from("patients").delete().in("id", ids);
    if (error) { toast.error("Erro ao excluir pacientes"); return; }
    toast.success(`${ids.length} paciente(s) excluído(s)`);
    setSelectedIds(new Set());
    setShowBulkDeleteConfirm(false);
    fetchPatients();
  };

  if (loading) return <div className="flex items-center justify-center py-16 text-muted-foreground">Carregando...</div>;

  const hasBulk = selectedIds.size > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">Pacientes</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Buscar paciente..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 h-10 text-sm w-full sm:w-60 bg-card border-2 border-border rounded-lg text-foreground focus:border-ring focus:outline-none transition-colors" />
          </div>
          <Button onClick={() => openEditModal(null)} className="h-10 gap-2"><Plus size={16} /> Novo Paciente</Button>
        </div>
      </div>

      {/* Reserved bulk actions bar */}
      <div className="min-h-[40px] flex flex-wrap items-center gap-2">
        {hasBulk ? (
          <>
            <Checkbox
              checked={selectedIds.size === filtered.length}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {selectedIds.size} selecionado(s)
            </span>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs sm:text-sm"
              onClick={handleBulkToggle}
            >
              {allSelectedActive ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
              <span className="hidden sm:inline">{bulkToggleLabel} ({selectedIds.size})</span>
              <span className="sm:hidden">{bulkToggleLabel}</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs sm:text-sm text-[hsl(var(--archive-action))] border-[hsl(var(--archive-action))] hover:bg-[hsl(var(--archive-action))]/10"
              onClick={() => setShowBulkDeleteConfirm(true)}
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">Excluir ({selectedIds.size})</span>
              <span className="sm:hidden">Excluir</span>
            </Button>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">Selecione pacientes para ações em lote</span>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {filtered.length > 0 ? (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="w-10 px-3 py-3">
                      <Checkbox
                        checked={hasBulk && selectedIds.size === filtered.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Nome</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Contato</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Valor Sessão</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Horário Fixo</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className={cn(
                      "border-b border-border last:border-0 hover:bg-muted/30 transition-colors",
                      selectedIds.has(p.id) && "bg-primary/5"
                    )}>
                      <td className="px-3 py-3">
                        <Checkbox
                          checked={selectedIds.has(p.id)}
                          onCheckedChange={() => toggleSelect(p.id)}
                        />
                      </td>
                      <td className="px-5 py-3 font-medium text-foreground">
                        <button onClick={() => setViewPatient(p)} className="hover:text-primary hover:underline transition-colors text-left">{p.name}</button>
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-foreground">{p.phone}</div>
                        <div className="text-xs text-muted-foreground">{p.email}</div>
                      </td>
                      <td className="px-5 py-3 text-foreground">R$ {p.session_value}</td>
                      <td className="px-5 py-3 text-foreground">{p.fixed_schedule || "—"}</td>
                      <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditModal(p)} className="p-2 text-[hsl(var(--text-link))] hover:bg-muted rounded-md transition-colors" aria-label="Editar"><Edit2 size={16} /></button>
                          <Switch
                            checked={p.status === "Ativo"}
                            onCheckedChange={() => handleToggleStatus(p)}
                            aria-label={p.status === "Ativo" ? "Desativar paciente" : "Ativar paciente"}
                          />
                          <button
                            onClick={() => { setDeletePatientId(p.id); setShowDeleteConfirm(true); }}
                            className="p-2 text-[hsl(var(--archive-action))] hover:bg-[hsl(var(--archive-action))]/10 rounded-md transition-colors"
                            aria-label="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-border">
              {filtered.map((p) => (
                <div key={p.id} className={cn("p-4 space-y-3", selectedIds.has(p.id) && "bg-primary/5")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedIds.has(p.id)}
                        onCheckedChange={() => toggleSelect(p.id)}
                      />
                      <button onClick={() => setViewPatient(p)} className="font-medium text-foreground hover:text-primary hover:underline transition-colors text-left">{p.name}</button>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1.5">
                    <p className="flex items-center gap-1.5"><Phone size={14} /> {p.phone}</p>
                    <p className="flex items-center gap-1.5"><DollarSign size={14} /> R$ {p.session_value}</p>
                    <p className="flex items-center gap-1.5"><Clock size={14} /> {p.fixed_schedule || "—"}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => openEditModal(p)}>Editar</Button>
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={p.status === "Ativo"}
                        onCheckedChange={() => handleToggleStatus(p)}
                        aria-label={p.status === "Ativo" ? "Desativar" : "Ativar"}
                      />
                      <span className="text-xs text-muted-foreground">{p.status === "Ativo" ? "Ativo" : "Inativo"}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setDeletePatientId(p.id); setShowDeleteConfirm(true); }}
                      className="text-[hsl(var(--archive-action))] hover:text-[hsl(var(--archive-action))] hover:bg-[hsl(var(--archive-action))]/10"
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center"><Users size={28} className="text-muted-foreground" /></div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum paciente encontrado</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">Comece adicionando seu primeiro paciente para gerenciar sessões e pagamentos.</p>
            <Button onClick={() => openEditModal(null)}>Cadastrar paciente</Button>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedPatient ? "Editar Paciente" : "Novo Paciente"} maxWidth="max-w-2xl">
        <form onSubmit={handleSave} className="space-y-4">
          <FormInput label="Nome completo" id="pat-name" name="name" defaultValue={selectedPatient?.name || ""} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label="Telefone" id="pat-phone" name="phone" defaultValue={selectedPatient?.phone || ""} />
            <FormInput label="Email" id="pat-email" name="email" type="email" defaultValue={selectedPatient?.email || ""} />
          </div>
          <FormInput label="Valor da sessão" id="pat-val" name="session_value" type="number" defaultValue={String(selectedPatient?.session_value || 200)} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label="Horário fixo" id="pat-time" name="fixed_schedule" defaultValue={selectedPatient?.fixed_schedule || ""} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Status</label>
              <select name="status" className="h-11 px-3 text-sm bg-card border-2 border-border rounded-lg text-foreground focus:border-ring focus:outline-none" defaultValue={selectedPatient?.status || "Ativo"}>
                <option>Ativo</option>
                <option>Inativo</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Anotações do Paciente</label>
            <textarea name="notes" className="h-24 px-3 py-2 text-sm bg-card border-2 border-border rounded-lg text-foreground focus:border-ring focus:outline-none resize-none" placeholder="Observações gerais..." defaultValue={selectedPatient?.notes || ""} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar Informações"}</Button>
          </div>
        </form>
      </Modal>

      {/* Single Delete Confirm */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir paciente</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este paciente? Todas as sessões e transações associadas também serão excluídas. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button
              className="bg-[hsl(var(--archive-action))] text-[hsl(var(--archive-action-foreground))] hover:bg-[hsl(var(--archive-action-hover))]"
              onClick={() => deletePatientId && handleDeletePatient(deletePatientId)}
            >
              <Trash2 size={14} className="mr-1.5" /> Excluir paciente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Bulk Delete Confirmation */}
      <Dialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir {selectedIds.size} paciente(s)? Todas as sessões e transações associadas também serão excluídas. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button
              className="bg-[hsl(var(--archive-action))] text-[hsl(var(--archive-action-foreground))] hover:bg-[hsl(var(--archive-action-hover))]"
              onClick={handleBulkDelete}
            >
              <Trash2 size={14} className="mr-1.5" /> Excluir pacientes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Patient Details Modal */}
      <Modal isOpen={!!viewPatient} onClose={() => setViewPatient(null)} title="Dados do Paciente" maxWidth="max-w-md">
        {viewPatient && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">{viewPatient.name}</h3>
              <StatusBadge status={viewPatient.status} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {viewPatient.phone && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-muted-foreground" />
                    <span className="text-sm text-foreground">{viewPatient.phone}</span>
                    <a
                      href={getWhatsAppUrl(viewPatient.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded-md text-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,45%)]/10 transition-colors"
                      aria-label="Enviar mensagem no WhatsApp"
                    >
                      <MessageCircle size={16} />
                    </a>
                  </div>
                </div>
              )}
              {viewPatient.email && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-muted-foreground" />
                    <span className="text-sm text-foreground">{viewPatient.email}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Valor da Sessão</p>
                <div className="flex items-center gap-2">
                  <DollarSign size={14} className="text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">R$ {viewPatient.session_value}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Horário Fixo</p>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">{viewPatient.fixed_schedule || "—"}</span>
                </div>
              </div>
            </div>

            {viewPatient.notes && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Anotações</p>
                <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg border border-border">
                  <FileText size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground whitespace-pre-wrap">{viewPatient.notes}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setViewPatient(null)}>Fechar</Button>
              <Button onClick={() => { setViewPatient(null); openEditModal(viewPatient); }}>Editar Paciente</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
