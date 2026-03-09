import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FormInput } from "./FormInput";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const SettingsView = () => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    full_name: "",
    crp: "",
    email: "",
    phone: "",
    address: "",
    default_duration: 50,
    default_value: 200,
  });

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("psychologist_settings").select("*").single();
      if (data) {
        setSettings({
          full_name: data.full_name || "",
          crp: data.crp || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          default_duration: data.default_duration || 50,
          default_value: data.default_value || 200,
        });
      }
    };
    fetch();
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      full_name: fd.get("full_name") as string,
      crp: fd.get("crp") as string,
      email: fd.get("email") as string,
      phone: fd.get("phone") as string,
      address: fd.get("address") as string,
      default_duration: parseInt(fd.get("default_duration") as string) || 50,
      default_value: parseInt(fd.get("default_value") as string) || 200,
    };

    const { error } = await supabase
      .from("psychologist_settings")
      .update(payload)
      .eq("user_id", user.id);

    setSaving(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Configurações salvas!");
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <h2 className="text-2xl font-bold text-foreground">Configurações</h2>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
          <h3 className="text-base font-semibold text-foreground">Dados do Profissional</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label="Nome completo" id="set-name" name="full_name" defaultValue={settings.full_name} />
            <FormInput label="CRP" id="set-crp" name="crp" defaultValue={settings.crp} />
            <FormInput label="Email" id="set-email" name="email" type="email" defaultValue={settings.email} />
            <FormInput label="Telefone" id="set-phone" name="phone" defaultValue={settings.phone} />
          </div>
          <FormInput label="Endereço do consultório" id="set-address" name="address" defaultValue={settings.address} />
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-semibold text-foreground">Preferências de Sessão</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label="Duração padrão (min)" id="set-dur" name="default_duration" type="number" defaultValue={String(settings.default_duration)} />
            <FormInput label="Valor padrão (R$)" id="set-val" name="default_value" type="number" defaultValue={String(settings.default_value)} />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar Alterações"}</Button>
        </div>
      </form>
    </div>
  );
};
