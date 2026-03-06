import { cn } from "@/lib/utils";

type StatusType = "pendente" | "pago" | "agendado" | "cancelado" | "ativo" | "inativo" | "realizado";

interface StatusBadgeProps {
  status: string;
  children?: React.ReactNode;
}

const statusStyles: Record<string, string> = {
  pendente: "bg-[hsl(var(--status-error-bg))] text-[hsl(var(--status-error-text))] border-[hsl(var(--status-error-border))]",
  pago: "bg-[hsl(var(--status-success-bg))] text-[hsl(var(--status-success-text))] border-[hsl(var(--status-success-border))]",
  realizado: "bg-[hsl(var(--status-success-bg))] text-[hsl(var(--status-success-text))] border-[hsl(var(--status-success-border))]",
  agendado: "bg-[hsl(var(--status-info-bg))] text-[hsl(var(--status-info-text))] border-[hsl(var(--status-info-border))]",
  cancelado: "bg-[hsl(var(--status-neutral-bg))] text-[hsl(var(--status-neutral-text))] border-[hsl(var(--status-neutral-border))]",
  ativo: "bg-[hsl(var(--status-success-bg))] text-[hsl(var(--status-success-text))] border-[hsl(var(--status-success-border))]",
  inativo: "bg-[hsl(var(--status-neutral-bg))] text-[hsl(var(--status-neutral-text))] border-[hsl(var(--status-neutral-border))]",
};

export const StatusBadge = ({ status, children }: StatusBadgeProps) => {
  const key = status.toLowerCase() as StatusType;
  const style = statusStyles[key] || statusStyles.cancelado;

  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border", style)}>
      {children || status}
    </span>
  );
};
