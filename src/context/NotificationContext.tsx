import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from './AuthContext';
import { getSocket } from '@/realtime/socket';
import { notificationApi } from '@/api/notification.api';
import { AppNotification } from '@/api/types';

interface NotificationContextValue {
  items: AppNotification[];
  unread: number;
  /** Unread CHAT_MESSAGE notifications — drives the Inbox tab badge. */
  unreadChats: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  /** Mark a booking's chat notifications read (when its chat thread is opened). */
  markChatRead: (bookingId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    // Rider-only feature (drivers have no notifications UI in Phase 1).
    if (!user || user.role !== 'USER') return;
    setLoading(true);
    try {
      const [list, count] = await Promise.all([
        notificationApi.list(),
        notificationApi.unreadCount(),
      ]);
      setItems(list);
      setUnread(count);
    } catch {
      /* ignore — surfaced as empty/stale list */
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load on login; clear on logout.
  useEffect(() => {
    if (user) {
      refresh();
    } else {
      setItems([]);
      setUnread(0);
    }
  }, [user, refresh]);

  // Live updates via the app socket. The socket may connect slightly after login,
  // so retry attaching (capped) until it's available.
  useEffect(() => {
    if (!user || user.role !== 'USER') return;
    let socket: ReturnType<typeof getSocket> = null;
    let interval: ReturnType<typeof setInterval> | null = null;
    let attempts = 0;

    const onNew = (n: AppNotification) => {
      // Bump unread only when the item is genuinely new (avoids over-count on dup delivery).
      setItems((prev) => {
        if (prev.some((x) => x.id === n.id)) return prev;
        setUnread((c) => c + 1);
        return [n, ...prev];
      });
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const attach = () => {
      socket = getSocket();
      if (socket) {
        socket.on('notification:new', onNew);
        // Re-sync from the server on every (re)connect to recover any emits missed
        // while the socket was down.
        socket.on('connect', refresh);
        stopPolling();
        return true;
      }
      if (++attempts >= 20) {
        // ~10s — give up polling; AppState/foreground refresh will recover later.
        stopPolling();
        return true;
      }
      return false;
    };

    if (!attach()) interval = setInterval(attach, 500);

    return () => {
      stopPolling();
      socket?.off('notification:new', onNew);
      socket?.off('connect', refresh);
    };
  }, [user, refresh]);

  // Re-sync when the app returns to the foreground (covers backgrounded gaps).
  useEffect(() => {
    if (!user || user.role !== 'USER') return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [user, refresh]);

  const markRead = useCallback(async (id: string) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, isRead: true } : x)));
    try {
      setUnread(await notificationApi.markRead(id));
    } catch {
      /* optimistic UI already applied */
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
    setUnread(0);
    try {
      await notificationApi.markAllRead();
    } catch {
      /* ignore */
    }
  }, []);

  // Clear the chat notifications for one booking (called when its chat opens).
  const markChatRead = useCallback(
    async (bookingId: string) => {
      const targets = items.filter(
        (n) => n.type === 'CHAT_MESSAGE' && !n.isRead && n.data?.bookingId === bookingId
      );
      if (!targets.length) return;
      const ids = new Set(targets.map((t) => t.id));
      setItems((prev) => prev.map((n) => (ids.has(n.id) ? { ...n, isRead: true } : n)));
      try {
        let count = unread;
        for (const t of targets) count = await notificationApi.markRead(t.id);
        setUnread(count);
      } catch {
        /* optimistic UI already applied */
      }
    },
    [items, unread]
  );

  const unreadChats = items.filter((n) => n.type === 'CHAT_MESSAGE' && !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{ items, unread, unreadChats, loading, refresh, markRead, markAllRead, markChatRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
