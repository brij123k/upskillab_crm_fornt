import { useEffect, useState } from 'react';
import {
  connectNotificationSocket,
  disconnectNotificationSocket,
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
} from '@/config/notification';

export function useNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {

    // 1️⃣ Fetch notifications
    fetchNotifications()
      .then((res) => {
        if (Array.isArray(res)) {
          setNotifications(res);
        } else {
          setNotifications([]);
        }
      })
      .catch((err) => {
        setNotifications([]);
      });

    // 2️⃣ Fetch unread count
    fetchUnreadCount()
      .then((count) => {
        setUnreadCount(typeof count === 'number' ? count : 0);
      })
      .catch((err) => {
        console.error('🔴 fetchUnreadCount error:', err);
        setUnreadCount(0);
      });

    // 3️⃣ Connect socket
    const socket = connectNotificationSocket(
      (n) => {
        setNotifications((prev = []) => {
          console.log('📦 previous notifications:', prev);
          return [n, ...prev];
        });
        setUnreadCount((c) => c + 1);
      },
      (count) => {
        setUnreadCount(typeof count === 'number' ? count : 0);
      },
    );

    return () => {
      disconnectNotificationSocket();
    };
  }, []);
  const readOne = async (id: string) => {
    await markAsRead(id);
    setNotifications((prev = []) =>
      prev.map((n) =>
        n._id === id ? { ...n, isRead: true } : n,
      ),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const readAll = async () => {
    console.log('👆 readAll called');
    await markAllAsRead();
    setNotifications((prev = []) =>
      prev.map((n) => ({ ...n, isRead: true })),
    );
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    readOne,
    readAll,
  };
}
