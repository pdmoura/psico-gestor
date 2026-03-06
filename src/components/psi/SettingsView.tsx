import { Button } from "@/components/ui/button";
import { FormInput } from "./FormInput";

export const SettingsView = () => {
  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <h2 className="text-2xl font-bold text-foreground">Configurações</h2>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
        <h3 className="text-base font-semibold text-foreground">Dados do Profissional</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput label="Nome completo" id="set-name" defaultValue="Dra. Mariana Santos" />
          <FormInput label="CRP" id="set-crp" defaultValue="06/123456" />
          <FormInput label="Email" id="set-email" type="email" defaultValue="mariana@psigestao.com" />
          <FormInput label="Telefone" id="set-phone" defaultValue="(11) 99999-0000" />
        </div>
        <FormInput label="Endereço do consultório" id="set-address" defaultValue="Rua das Flores, 123 - São Paulo, SP" />
        <div className="flex justify-end pt-2">
          <Button>Salvar Alterações</Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-semibold text-foreground">Preferências de Sessão</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput label="Duração padrão (min)" id="set-dur" type="number" defaultValue="50" />
          <FormInput label="Valor padrão (R$)" id="set-val" defaultValue="200" />
        </div>
        <div className="flex justify-end pt-2">
          <Button>Salvar</Button>
        </div>
      </div>
    </div>
  );
};
