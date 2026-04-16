// utils/callSocket.ts
import { io, Socket } from 'socket.io-client';
import { getToken } from '@/auth';

let callSocket: Socket | null = null;

const SOCKET_URL ='https://crm.upskillab.in';
// const SOCKET_URL ='http://localhost:3000';
export function connectCallSocket(handlers: {
  onCallCompleted?: (data: any) => void;
  onCallBackReceived?: (data: any) => void;
  onUnknownCall?: (data: any) => void;
}) {
  if (!callSocket) {
    const token = getToken();

    callSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    callSocket.on('connect', () => {
      console.log('🟢 Socket connected');
    });

    callSocket.on('disconnect', () => {
      console.log('🔴 Socket disconnected');
    });

    callSocket.on('connect_error', (error) => {
      console.error('Socket error:', error);
    });
  }

  // ✅ Always attach listeners (even if already connected)

  if (handlers.onCallCompleted) {
    callSocket.off('call-completed'); // prevent duplicate
    callSocket.on('call-completed', handlers.onCallCompleted);
  }

  if (handlers.onCallBackReceived) {
    callSocket.off('callBack-received');
    callSocket.on('callBack-received', handlers.onCallBackReceived);
  }

  if (handlers.onUnknownCall) {
    callSocket.off('Unknow-call');
    callSocket.on('Unknow-call', handlers.onUnknownCall);
  }

  return callSocket;
}

export function disconnectCallSocket() {
  if (callSocket) {
    callSocket.disconnect();
    callSocket = null;
  }
}