// app/context/SocketContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const BASE_URL = __DEV__
  ? 'http://10.0.2.2:5001'
  : 'https://your-prod-url.com';

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { firebaseUser } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!firebaseUser) return;
    (async () => {
      const token = await firebaseUser.getIdToken();
      const sock = io(BASE_URL, {
        auth: { token }
      });
      setSocket(sock);
      return () => { sock.disconnect(); };
    })();
  }, [firebaseUser]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const socket = useContext(SocketContext);
  if (!socket) throw new Error("Socket not initialized");
  return socket;
};
