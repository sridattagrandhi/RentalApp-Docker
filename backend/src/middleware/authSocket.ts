// backend/src/middleware/authSocket.ts
import { Socket } from 'socket.io';
import admin from 'firebase-admin'; // or however you verify your tokens

export async function protectSocket(socket: Socket, next: (err?: any) => void) {
  const token = socket.handshake.auth.token as string;
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    socket.data.userId = decoded.uid;
    next();
  } catch (err) {
    next(new Error("Unauthorized"));
  }
}
