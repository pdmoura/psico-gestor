import { useState, FormEvent } from "react";
import { FormInput } from "./FormInput";
import { Button } from "@/components/ui/button";

interface AuthViewProps {
  onLogin: () => void;
}

export const AuthView = ({ onLogin }: AuthViewProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [emailErr, setEmailErr] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    setTimeout(() => {
      if (!email.includes("@")) {
        setEmailErr("Por favor, insira um email válido.");
        setLoading(false);
        return;
      }
      setEmailErr("");
      onLogin();
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left: Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-[-50%] left-[-30%] w-[600px] h-[600px] rounded-full bg-primary-foreground/5" />
        <div className="absolute bottom-[-40%] right-[-20%] w-[500px] h-[500px] rounded-full bg-primary-foreground/5" />

        <div className="relative z-10 text-center max-w-md animate-fade-up">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center text-primary-foreground font-bold text-2xl">
              P
            </div>
            <span className="text-2xl font-bold text-primary-foreground">PsiGestão</span>
          </div>

          {/* Simple illustration */}
          <svg viewBox="0 0 300 200" className="w-full max-w-xs mx-auto mb-8">
            <rect x="50" y="30" width="200" height="140" rx="12" fill="currentColor" className="text-primary-foreground/10" />
            <rect x="70" y="50" width="80" height="10" rx="5" fill="currentColor" className="text-primary-foreground/30" />
            <rect x="70" y="70" width="120" height="8" rx="4" fill="currentColor" className="text-primary-foreground/20" />
            <rect x="70" y="90" width="100" height="8" rx="4" fill="currentColor" className="text-primary-foreground/20" />
            <circle cx="220" cy="60" r="20" fill="currentColor" className="text-primary-foreground/15" />
            <rect x="70" y="120" width="60" height="30" rx="8" fill="currentColor" className="text-primary-foreground/25" />
            <rect x="140" y="120" width="60" height="30" rx="8" fill="currentColor" className="text-primary-foreground/15" />
          </svg>

          <h2 className="text-2xl font-bold text-primary-foreground mb-3">
            Sua clínica remota, simplificada.
          </h2>
          <p className="text-primary-foreground/70 text-sm leading-relaxed">
            Foque no que realmente importa: o bem-estar dos seus pacientes. Nós cuidamos do resto.
          </p>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-background">
        <div className="w-full max-w-sm animate-fade-up">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
              P
            </div>
            <span className="text-xl font-bold text-foreground">PsiGestão</span>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            {isLogin ? "Entrar na sua conta" : "Criar conta gratuita"}
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            {isLogin ? "Bem-vindo de volta! Por favor, insira seus dados." : "Comece a gerenciar sua clínica hoje mesmo."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <FormInput label="Nome completo" id="name" placeholder="Dra. Maria Silva" required />
            )}
            <FormInput
              label="Email"
              id="email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              error={emailErr}
              required
            />
            <FormInput label="Senha" id="password" type="password" placeholder="••••••••" required />

            {isLogin && (
              <div className="text-right">
                <button type="button" className="text-xs font-medium text-link hover:underline">
                  Esqueci minha senha
                </button>
              </div>
            )}

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar minha conta"}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">ou</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Ainda não tem uma conta? " : "Já tem uma conta? "}
            <button
              onClick={() => { setIsLogin(!isLogin); setEmailErr(""); }}
              className="font-medium text-link hover:underline"
            >
              {isLogin ? "Criar conta gratuita" : "Entrar"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
