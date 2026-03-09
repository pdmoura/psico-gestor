import { useState, FormEvent } from "react";
import { FormInput } from "./FormInput";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const AuthView = () => {
  const { signIn, signUp, resetPassword } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailErr, setEmailErr] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setEmailErr("");
    const fd = new FormData(e.currentTarget);
    const email = (fd.get("email") as string).trim();
    const password = fd.get("password") as string;
    const name = fd.get("name") as string;

    if (isForgot) {
      const { error } = await resetPassword(email);
      setLoading(false);
      if (error) { setEmailErr(error); return; }
      toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
      setIsForgot(false);
      return;
    }

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) setEmailErr(error);
    } else {
      const { error } = await signUp(email, password, name || "");
      if (error) { setEmailErr(error); }
      else { toast.success("Conta criada! Verifique seu email para confirmar."); }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left: Dark teal illustration panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12"
        style={{ background: "linear-gradient(160deg, hsl(200 30% 14%), hsl(210 35% 12%))" }}
      >
        <div className="absolute top-[-20%] left-[-15%] w-[500px] h-[500px] rounded-full" style={{ background: "rgba(255,255,255,0.02)" }} />
        <div className="absolute bottom-[-25%] right-[-10%] w-[400px] h-[400px] rounded-full" style={{ background: "rgba(255,255,255,0.02)" }} />

        <div className="relative z-10 text-center max-w-md animate-fade-up">
          <div className="flex items-center justify-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center text-white font-bold text-2xl">P</div>
            <span className="text-2xl font-bold text-white">PsiGestão</span>
          </div>

          <svg viewBox="0 0 280 220" className="w-full max-w-[280px] mx-auto mb-10">
            <rect x="30" y="20" width="220" height="140" rx="10" fill="none" stroke="hsl(210 15% 40%)" strokeWidth="3" />
            <rect x="40" y="30" width="200" height="120" rx="6" fill="hsl(210 35% 12%)" />
            <rect x="120" y="160" width="40" height="20" fill="none" stroke="hsl(210 15% 40%)" strokeWidth="3" />
            <rect x="100" y="180" width="80" height="6" rx="3" fill="none" stroke="hsl(210 15% 40%)" strokeWidth="3" />
            <circle cx="140" cy="80" r="24" fill="hsl(174 70% 50%)" />
            <path d="M 108 130 Q 108 108 140 108 Q 172 108 172 130" fill="none" stroke="hsl(174 70% 50%)" strokeWidth="4" strokeLinecap="round" />
            <circle cx="62" cy="52" r="6" fill="hsl(210 80% 55%)" />
            <circle cx="218" cy="52" r="6" fill="hsl(350 60% 55%)" opacity="0.7" />
          </svg>

          <h2 className="text-2xl font-bold text-white mb-3">Sua clínica remota, simplificada.</h2>
          <p className="text-white/50 text-sm leading-relaxed">Foque no que realmente importa: o bem-estar dos seus pacientes. Nós cuidamos do resto.</p>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-background">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">P</div>
            <span className="text-xl font-bold text-foreground">PsiGestão</span>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            {isForgot ? "Recuperar senha" : isLogin ? "Entrar na sua conta" : "Criar conta gratuita"}
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            {isForgot ? "Enviaremos um link para redefinir sua senha." : isLogin ? "Bem-vindo de volta! Por favor, insira seus dados." : "Comece a gerenciar sua clínica hoje mesmo."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && !isForgot && (
              <FormInput label="Nome completo" id="name" name="name" placeholder="Dra. Maria Silva" required />
            )}
            <FormInput label="Email" id="email" name="email" type="email" placeholder="seu@email.com" error={emailErr} required />
            {!isForgot && (
              <FormInput label="Senha" id="password" name="password" type="password" placeholder="••••••••" required />
            )}

            {isLogin && !isForgot && (
              <div className="text-right">
                <button type="button" onClick={() => { setIsForgot(true); setEmailErr(""); }} className="text-xs font-medium text-[hsl(var(--text-link))] hover:underline">
                  Esqueci minha senha
                </button>
              </div>
            )}

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? "Carregando..." : isForgot ? "Enviar link" : isLogin ? "Entrar" : "Criar minha conta"}
            </Button>
          </form>

          {!isForgot && (
            <>
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">ou</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {isLogin ? "Ainda não tem uma conta? " : "Já tem uma conta? "}
                <button onClick={() => { setIsLogin(!isLogin); setEmailErr(""); }} className="font-medium text-[hsl(var(--text-link))] hover:underline">
                  {isLogin ? "Criar conta gratuita" : "Entrar"}
                </button>
              </p>
            </>
          )}

          {isForgot && (
            <p className="text-center text-sm text-muted-foreground mt-6">
              <button onClick={() => { setIsForgot(false); setEmailErr(""); }} className="font-medium text-[hsl(var(--text-link))] hover:underline">
                Voltar ao login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
