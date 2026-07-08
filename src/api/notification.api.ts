import { api, unwrap } from './client';
import { AppNotification } from './types';

export const notificationApi = {
  async list(before?: string): Promise<AppNotification[]> {
    const q = before ? `?before=${encodeURIComponent(before)}` : '';
    return unwrap((await api.get(`/notifications${q}`)).data);
  },
  async unreadCount(): Promise<number> {
    const data = unwrap((await api.get('/notifications/unread-count')).data) as { count: number };
    return data.count;
  },
  async markRead(id: string): Promise<number> {
    const data = unwrap((await api.post(`/notifications/${id}/read`)).data) as { count: number };
    return data.count;
  },
  async markAllRead(): Promise<number> {
    const data = unwrap((await api.post('/notifications/read-all')).data) as { count: number };
    return data.count;
  },
};
