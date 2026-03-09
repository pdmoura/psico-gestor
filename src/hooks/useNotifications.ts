import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { format, differenceInMinutes, parseISO, addDays, isToday, isTomorrow } from "date-fns";

export interface AppNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  createdAt: Date;
}

// Track which notifications have already been fired (persisted per session)
const firedNotifications = new Set<string>();

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkSessions = useCallback(async () => {
    if (!user) return;

    const now = new Date();
    const todayStr = format(now, "yyyy-MM-dd");
    const tomorrowStr = format(addDays(now, 1), "yyyy-MM-dd");

    // Fetch today's and tomorrow's sessions
    const { data: sessions } = await supabase
      .from("sessions")
      .select("*, patients(name)")
      .in("date", [todayStr, tomorrowStr])
      .eq("status", "Agendado");

    if (!sessions) return;

    const newNotifs: AppNotification[] = [];

    for (const s of sessions) {
      const patientName = (s as any).patients?.name || "Paciente";
      const sessionDate = parseISO(s.date);
      const [h, m] = s.start_time.split(":").map(Number);
      const sessionDateTime = new Date(sessionDate);
      sessionDateTime.setHours(h, m, 0, 0);

      const diffMin = differenceInMinutes(sessionDateTime, now);

      // Session time reminders (today only)
      if (isToday(sessionDate)) {
        // 15 minutes before
        if (diffMin <= 15 && diffMin > 5) {
          const key = `15min-${s.id}`;
          if (!firedNotifications.has(key)) {
            firedNotifications.add(key);
            newNotifs.push({
              id: key,
              title: "Sessão em 15 minutos",
              desc: `${patientName} às ${s.start_time}.`,
              time: "Agora",
              read: false,
              createdAt: now,
            });
          }
        }

        // 5 minutes before
        if (diffMin <= 5 && diffMin > 0) {
          const key = `5min-${s.id}`;
          if (!firedNotifications.has(key)) {
            firedNotifications.add(key);
            newNotifs.push({
              id: key,
              title: "Sessão em 5 minutos",
              desc: `${patientName} às ${s.start_time}. Prepare-se!`,
              time: "Agora",
              read: false,
              createdAt: now,
            });
          }
        }

        // Session time (0 to -5 min window)
        if (diffMin <= 0 && diffMin > -5) {
          const key = `now-${s.id}`;
          if (!firedNotifications.has(key)) {
            firedNotifications.add(key);
            newNotifs.push({
              id: key,
              title: "Sessão agora!",
              desc: `Hora da sessão com ${patientName}.`,
              time: "Agora",
              read: false,
              createdAt: now,
            });
          }
        }
      }

      // Payment reminder: 1 day before session
      if (isTomorrow(sessionDate) && s.payment_status === "Pendente") {
        const key = `payment-${s.id}`;
        if (!firedNotifications.has(key)) {
          firedNotifications.add(key);
          newNotifs.push({
            id: key,
            title: "Lembrete de cobrança",
            desc: `Sessão com ${patientName} amanhã (${s.start_time}). Pagamento pendente: R$ ${s.value}.`,
            time: "Agora",
            read: false,
            createdAt: now,
          });
        }
      }
    }

    if (newNotifs.length > 0) {
      setNotifications(prev => [...newNotifs, ...prev]);
    }
  }, [user]);

  useEffect(() => {
    checkSessions();
    // Check every 60 seconds
    intervalRef.current = setInterval(checkSessions, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkSessions]);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, markAllRead, markRead };
}
