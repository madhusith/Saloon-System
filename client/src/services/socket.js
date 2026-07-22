import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5050';

let socket = null;

export const initiateSocketConnection = (room = null) => {
  if (socket && socket.connected) return socket;

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    withCredentials: true,
    autoConnect: true
  });

  console.log('Initiating real-time connection...');

  socket.on('connect', () => {
    console.log('Connected to real-time sync server.');
    if (room) {
      socket.emit('join', room);
    }
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from real-time sync server.');
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log('Disconnecting real-time sync server.');
    socket.disconnect();
    socket = null;
  }
};

export const subscribeToEvent = (event, callback) => {
  if (!socket) {
    // Auto-initiate if someone tries to subscribe without connection
    initiateSocketConnection();
  }
  socket.on(event, callback);
};

export const unsubscribeFromEvent = (event) => {
  if (socket) {
    socket.off(event);
  }
};

export const getSocket = () => socket;
