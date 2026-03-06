import { useState } from "react";
import { Search, Edit2, Archive, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { Modal } from "./Modal";
import { FormInput } from "./FormInput";

interface Patient {
  id: number;
  name: string;
  phone: string;
  email: string;
  val: string;
  time: string;
  status: string;
}

export const PatientsView = () => {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const patients: Patient[] = [
    { id: 1, name: "Alice Guimarães", phone: "(11) 98765-4321", email: "alice@email.com", val: "R$ 200", time: "Ter, 14h", status: "Ativo" },
    { id: 2, name: "Bruno Costa", phone: "(11) 91234-5678", email: "bruno@email.com", val: "R$ 180", time: "Qua, 10h", status: "Ativo" },
    { id: 3, name: "Carla Dias", phone: "(21) 99999-8888", email: "carla@email.com", val: "R$ 250", time: "Qui, 18h", status: "Inativo" },
  ];

  const filtered = patients.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const openEditModal = (patient: Patient | null) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">Pacientes</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 h-10 text-sm w-full sm:w-60 bg-card border-2 border-border rounded-lg text-foreground focus:border-ring focus:outline-none transition-colors"
            />
          </div>
          <select className="h-10 px-3 text-sm bg-card border-2 border-border rounded-lg text-foreground focus:border-ring focus:outline-none">
            <option>Todos os status</option>
            <option>Ativos</option>
            <option>Inativos</option>
          </select>
          <Button onClick={() => openEditModal(null)} className="h-10 gap-2">
            <Plus size={16} /> Novo Paciente
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {filtered.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
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
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 font-medium text-foreground">{p.name}</td>
                      <td className="px-5 py-3">
                        <div className="text-foreground">{p.phone}</div>
                        <div className="text-xs text-muted-foreground">{p.email}</div>
                      </td>
                      <td className="px-5 py-3 text-foreground">{p.val}</td>
                      <td className="px-5 py-3 text-foreground">{p.time}</td>
                      <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditModal(p)} className="p-2 text-link hover:bg-muted rounded-md transition-colors" aria-label="Editar">
                            <Edit2 size={16} />
                          </button>
                          <button className="p-2 text-muted-foreground hover:bg-muted rounded-md transition-colors" aria-label="Arquivar">
                            <Archive size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-border">
              {filtered.map((p) => (
                <div key={p.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{p.name}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>📞 {p.phone}</p>
                    <p>💰 {p.val}</p>
                    <p>🕒 {p.time}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditModal(p)}>Editar</Button>
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(p)}>Perfil</Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Users size={28} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum paciente encontrado</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Comece adicionando seu primeiro paciente para gerenciar sessões e pagamentos.
            </p>
            <Button onClick={() => openEditModal(null)}>Cadastrar paciente</Button>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-border bg-muted/30 gap-2">
            <span className="text-xs text-muted-foreground">Mostrando 1-{filtered.length} de {patients.length}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>Ant</Button>
              <Button variant="outline" size="sm" disabled>Próx</Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedPatient ? "Editar Paciente" : "Novo Paciente"} maxWidth="max-w-2xl">
        <div className="space-y-4">
          <FormInput label="Nome completo" id="pat-name" defaultValue={selectedPatient?.name || ""} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label="Telefone" id="pat-phone" defaultValue={selectedPatient?.phone || ""} required />
            <FormInput label="Email" id="pat-email" type="email" defaultValue={selectedPatient?.email || ""} required />
          </div>
          <FormInput label="Valor da sessão" id="pat-val" defaultValue={selectedPatient?.val || ""} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label="Horário fixo" id="pat-time" defaultValue={selectedPatient?.time || ""} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Status</label>
              <select className="h-11 px-3 text-sm bg-card border-2 border-border rounded-lg text-foreground focus:border-ring focus:outline-none" defaultValue={selectedPatient?.status || "Ativo"}>
                <option>Ativo</option>
                <option>Inativo</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Anotações do Paciente</label>
            <textarea className="h-24 px-3 py-2 text-sm bg-card border-2 border-border rounded-lg text-foreground focus:border-ring focus:outline-none resize-none" placeholder="Observações gerais..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={() => setIsModalOpen(false)}>Salvar Informações</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
