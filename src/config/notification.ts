import { io, Socket } from 'socket.io-client';
import { getToken } from '@/auth';
import axios from 'axios';
import { getDataHandlerWithToken, patchTokenDataHandler } from './services';
import ApiConfig from './apiConfig';

let socket: Socket | null = null;

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
// const SOCKET_URL = import.meta.env.VITE_API_URL || 'https://crm.upskillab.in';

export function connectNotificationSocket(
  onNew: (n: any) => void,
  onCount: (count: number) => void,
) {
  if (socket) {
    return socket;
  }

  const token = getToken();

  socket = io(`${SOCKET_URL}/notifications`, {
    auth: { token },
    transports: ['websocket'],
  });

  socket.on('notification:new', onNew);
  socket.on('notification:count', onCount);

  return socket;
}

export function disconnectNotificationSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export async function fetchNotifications() {
  const { data } = await getDataHandlerWithToken('notification', null, null, false);
  return data;
}

export async function fetchUnreadCount() {
  const res = await getDataHandlerWithToken('notificationUnreadCount', null, null, false);
  return res.count;
}

export async function markAsRead(id: string) {
  return await patchTokenDataHandler(ApiConfig.readNotification(id), null, true);
}

// export async function markAllAsRead() {
//   return await patchTokenDataHandler(ApiConfig.readAllNotification, null, true);
// }
export async function markAllAsRead() {
  console.log('🔵 markAllAsRead called, endpoint:', ApiConfig.readAllNotification);
  try {
    const result = await patchTokenDataHandler(ApiConfig.readAllNotification, null, true);
    console.log('✅ markAllAsRead success:', result);
    return result;
  } catch (error) {
    console.error('🔴 markAllAsRead error:', error);
    throw error;
  }
}