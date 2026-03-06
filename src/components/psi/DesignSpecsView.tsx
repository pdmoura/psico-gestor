import { StatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/button";

export const DesignSpecsView = () => {
  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      <h2 className="text-2xl font-bold text-foreground">Design Specs</h2>

      {/* Colors */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-semibold text-foreground">Cores do Sistema</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { name: "Primary", cls: "bg-primary" },
            { name: "Background", cls: "bg-background border" },
            { name: "Card", cls: "bg-card border" },
            { name: "Destructive", cls: "bg-destructive" },
            { name: "Muted", cls: "bg-muted" },
            { name: "Foreground", cls: "bg-foreground" },
            { name: "Border", cls: "bg-border" },
            { name: "Ring", cls: "bg-ring" },
          ].map((c, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className={`w-full h-12 rounded-lg ${c.cls}`} />
              <span className="text-xs text-muted-foreground">{c.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-semibold text-foreground">Status Badges</h3>
        <div className="flex flex-wrap gap-3">
          {["Ativo", "Inativo", "Pendente", "Pago", "Agendado", "Cancelado", "Realizado"].map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-semibold text-foreground">Botões</h3>
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="ghost">Ghost</Button>
          <Button disabled>Disabled</Button>
        </div>
      </div>

      {/* Typography */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-3">
        <h3 className="text-base font-semibold text-foreground">Tipografia</h3>
        <p className="text-2xl font-bold text-foreground">Heading 2XL Bold</p>
        <p className="text-xl font-semibold text-foreground">Heading XL Semibold</p>
        <p className="text-base font-medium text-foreground">Body Base Medium</p>
        <p className="text-sm text-muted-foreground">Body SM Muted</p>
        <p className="text-xs text-muted-foreground">Caption XS</p>
      </div>
    </div>
  );
};
