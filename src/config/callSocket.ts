// utils/callSocket.ts
import { io, Socket } from 'socket.io-client';
import { getToken } from '@/auth';

let callSocket: Socket | null = null;

const SOCKET_URL = import.meta.env.VITE_API_URL || 'https://crm.upskillab.in';

export function connectCallSocket(
  onCallCompleted: (data: any) => void,
) {
  if (callSocket?.connected) {
    return callSocket;
  }

  const token = getToken();

  callSocket = io(SOCKET_URL, { 
    auth: { token },
    transports: ['websocket'],
  });

  callSocket.on('call-completed', onCallCompleted);

  callSocket.on('connect', () => {
    // console.log('Call socket connected');
  });

  callSocket.on('disconnect', () => {
    // console.log('Call socket disconnected');
  });

  callSocket.on('connect_error', (error) => {
    console.error('Call socket connection error:', error);
  });

  return callSocket;
}

export function disconnectCallSocket() {
  if (callSocket) {
    callSocket.disconnect();
    callSocket = null;
  }
}