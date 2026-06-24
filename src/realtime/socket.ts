import { io, Socket } from 'socket.io-client';
import { env } from '@/config/env';

// Socket.IO server lives at the API host without the trailing /api.
function socketUrl(): string {
  return env.apiUrl.replace(/\/api\/?$/, '');
}

let socket: Socket | null = null;

/** Connect (or reuse) the app's single socket, authenticated with the JWT. */
export function connectSocket(token: string): Socket {
  if (socket) {
    // Update token + (re)connect if needed.
    socket.auth = { token };
    if (!socket.connected) socket.connect();
    return socket;
  }
  socket = io(socketUrl(), {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
}

/** Join a booking room (chat + live status + driver location). */
export function joinBooking(bookingId: string) {
  socket?.emit('booking:join', bookingId);
}
