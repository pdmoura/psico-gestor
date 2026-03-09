import { useState, useEffect, FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FormInput } from "@/components/psi/FormInput";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setReady(true);
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("A senha deve ter pelo menos 6 caracteres."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Senha atualizada com sucesso!");
    navigate("/");
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-bold text-foreground mb-2">Link inválido</h1>
          <p className="text-sm text-muted-foreground mb-4">Este link de recuperação expirou ou é inválido.</p>
          <Button onClick={() => navigate("/")}>Voltar ao login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm animate-fade-up">
        <h1 className="text-2xl font-bold text-foreground mb-2">Nova senha</h1>
        <p className="text-sm text-muted-foreground mb-8">Digite sua nova senha abaixo.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput label="Nova senha" id="new-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? "Atualizando..." : "Atualizar senha"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
