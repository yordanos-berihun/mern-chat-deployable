import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { API_BASE } from '../apiClient';

let sharedSocket = null;

export function useSocket(currentUser) {
  const socketRef = useRef(sharedSocket);
  const [isConnected, setIsConnected] = useState(!!(sharedSocket && sharedSocket.connected));

  useEffect(() => {
    if (socketRef.current) {
      setIsConnected(socketRef.current.connected);
      return;
    }

    const s = io(API_BASE, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      withCredentials: true,
      auth: { token: localStorage.getItem('token') || null }
    });

    socketRef.current = s;
    sharedSocket = s;

    const onConnect = () => {
      setIsConnected(true);
      if (currentUser?._id) s.emit('userOnline', currentUser._id);
    };

    const onDisconnect = () => setIsConnected(false);

    const onReconnect = () => {
      setIsConnected(true);
      if (currentUser?._id) s.emit('userOnline', currentUser._id);
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('reconnect', onReconnect);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('reconnect', onReconnect);
      // NOTE: do not call s.disconnect() here since socket is shared app-wide
    };
  }, [currentUser?._id]);

  return { socketRef, isConnected };
}
