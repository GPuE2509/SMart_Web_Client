import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.sessionId = null;
    this.isConnected = false;
  }

  connect(sessionId) {
    if (this.socket && this.isConnected) {
      console.log('✅ Socket already connected');
      // Re-register with new sessionId if different
      if (this.sessionId !== sessionId) {
        this.sessionId = sessionId;
        this.socket.emit('register', sessionId);
        console.log('📝 Re-registered with new sessionId:', sessionId);
      }
      return this.socket;
    }

    this.sessionId = sessionId;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
    const socketUrl = apiUrl.replace('/api/v1', ''); // Remove /api/v1 for socket connection

    console.log('🔌 Connecting to socket at:', socketUrl);

    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 10000
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected:', this.socket.id);
      this.isConnected = true;
      
      // Register session with server IMMEDIATELY
      if (this.sessionId) {
        this.socket.emit('register', this.sessionId);
        console.log('📝 Session registered:', this.sessionId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('👋 Socket disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      // Re-register on reconnect
      if (this.sessionId) {
        this.socket.emit('register', this.sessionId);
        console.log('📝 Re-registered session after reconnect:', this.sessionId);
      }
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.sessionId = null;
      console.log('Socket disconnected manually');
    }
  }

  onLoginVerification(callback) {
    if (!this.socket) return;
    this.socket.on('login-verification', callback);
  }

  onLoginApproved(callback) {
    if (!this.socket) return;
    this.socket.on('login-approved', callback);
  }

  onLoginDenied(callback) {
    if (!this.socket) return;
    this.socket.on('login-denied', callback);
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.off('login-verification');
      this.socket.off('login-approved');
      this.socket.off('login-denied');
    }
  }

  getSessionId() {
    return this.sessionId;
  }

  isSocketConnected() {
    return this.isConnected;
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
