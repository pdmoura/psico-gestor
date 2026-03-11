import { Modal } from "./Modal";
import { StatusBadge } from "./StatusBadge";

interface SessionDetail {
  patientName: string;
  date: string;
  value: number;
  status: string;
  paymentStatus: string;
}

interface DashboardChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  sessions: SessionDetail[];
}

export const DashboardChartModal = ({ isOpen, onClose, title, sessions }: DashboardChartModalProps) => {
  const total = sessions.reduce((s, r) => s + r.value, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-lg">
      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma sessão encontrada.</p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground border-b border-border pb-2">
            <span>{sessions.length} sessão(ões)</span>
            <span className="font-semibold text-foreground">R$ {total.toLocaleString("pt-BR")}</span>
          </div>
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {sessions.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{s.patientName}</p>
                  <p className="text-xs text-muted-foreground">{s.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={s.paymentStatus} />
                  <span className="text-sm font-semibold text-foreground">R$ {s.value.toLocaleString("pt-BR")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};

export type { SessionDetail };
