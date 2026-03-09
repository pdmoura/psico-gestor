import { useState, useEffect } from "react";
import { Search, Edit2, Archive, Trash2, Plus, Users, Phone, DollarSign, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

type Patient = Tables<"patients">;

export const PatientsView = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Bulk select (always visible)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkArchiveConfirm, setShowBulkArchiveConfirm] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Single delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePatientId, setDeletePatientId] = useState<string | null>(null);

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

  const handleArchive = async (patient: Patient) => {
    const newStatus = patient.status === "Ativo" ? "Inativo" : "Ativo";
    const { error } = await supabase.from("patients").update({ status: newStatus }).eq("id", patient.id);
    if (error) { toast.error("Erro ao arquivar"); return; }
    toast.success(newStatus === "Inativo" ? "Paciente arquivado" : "Paciente reativado");
    fetchPatients();
  };

  const handleDeletePatient = async (id: string) => {
    // Delete related sessions and transactions first
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

  // Bulk
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

  const handleBulkArchive = async () => {
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from("patients").update({ status: "Inativo" }).in("id", ids);
    if (error) { toast.error("Erro ao arquivar pacientes"); return; }
    toast.success(`${ids.length} paciente(s) arquivado(s)`);
    setSelectedIds(new Set());
    setShowBulkArchiveConfirm(false);
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
          <div className="flex items-center gap-2 flex-wrap">
            {selectedIds.size > 0 && (
              <>
                <Button
                  size="sm"
                  className="gap-1.5 bg-[hsl(var(--archive-action))] text-[hsl(var(--archive-action-foreground))] hover:bg-[hsl(var(--archive-action-hover))]"
                  onClick={() => setShowBulkArchiveConfirm(true)}
                >
                  <Archive size={14} /> Arquivar ({selectedIds.size})
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-[hsl(var(--archive-action))] border-[hsl(var(--archive-action))] hover:bg-[hsl(var(--archive-action))]/10"
                  onClick={() => setShowBulkDeleteConfirm(true)}
                >
                  <Trash2 size={14} /> Excluir ({selectedIds.size})
                </Button>
              </>
            )}
            <Button onClick={() => openEditModal(null)} className="h-10 gap-2"><Plus size={16} /> Novo Paciente</Button>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {filtered.length > 0 ? (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="w-10 px-3 py-3">
                      {selectedIds.size > 0 && (
                        <Checkbox
                          checked={selectedIds.size === filtered.length}
                          onCheckedChange={toggleSelectAll}
                        />
                      )}
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
                      <td className="px-5 py-3 font-medium text-foreground">{p.name}</td>
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
                          <button
                            onClick={() => handleArchive(p)}
                            className="p-2 text-[hsl(var(--archive-action))] hover:bg-[hsl(var(--archive-action))]/10 rounded-md transition-colors"
                            aria-label="Arquivar"
                          >
                            <Archive size={16} />
                          </button>
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
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-muted/30">
                  <Checkbox
                    checked={selectedIds.size === filtered.length}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">Selecionar todos</span>
                </div>
              )}
              {filtered.map((p) => (
                <div key={p.id} className={cn("p-4 space-y-3", selectedIds.has(p.id) && "bg-primary/5")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedIds.has(p.id)}
                        onCheckedChange={() => toggleSelect(p.id)}
                      />
                      <span className="font-medium text-foreground">{p.name}</span>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1.5">
                    <p className="flex items-center gap-1.5"><Phone size={14} /> {p.phone}</p>
                    <p className="flex items-center gap-1.5"><DollarSign size={14} /> R$ {p.session_value}</p>
                    <p className="flex items-center gap-1.5"><Clock size={14} /> {p.fixed_schedule || "—"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditModal(p)}>Editar</Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleArchive(p)}
                      className="text-[hsl(var(--archive-action))] hover:text-[hsl(var(--archive-action))] hover:bg-[hsl(var(--archive-action))]/10"
                    >
                      {p.status === "Ativo" ? "Arquivar" : "Reativar"}
                    </Button>
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

      {/* Bulk Archive Confirmation */}
      <Dialog open={showBulkArchiveConfirm} onOpenChange={setShowBulkArchiveConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar arquivamento</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja arquivar {selectedIds.size} paciente(s)? Eles serão marcados como inativos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button
              className="bg-[hsl(var(--archive-action))] text-[hsl(var(--archive-action-foreground))] hover:bg-[hsl(var(--archive-action-hover))]"
              onClick={handleBulkArchive}
            >
              <Archive size={14} className="mr-1.5" /> Arquivar pacientes
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
    </div>
  );
};
