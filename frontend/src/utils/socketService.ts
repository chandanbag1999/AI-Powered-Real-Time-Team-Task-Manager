import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import type { Task } from '@/types';

type EventCallback = (...args: any[]) => void;
type EventMap = {
  'task-created': (task: Task) => void;
  'task-updated': (task: Task) => void;
  'task-deleted': (taskId: string) => void;
  'connection-status': (status: boolean) => void;
};

class SocketService {
  socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  // Global event bus to ensure all components get updates
  private globalListeners: Map<string, Set<EventCallback>> = new Map();
  private connected: boolean = false;

  // Initialize the socket connection
  connect(): void {
    if (this.socket) return; // Already connected

    // Get the socket URL from environment variables
    // This should be the base URL without the /api path
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    
    console.log('Connecting to socket server at:', socketUrl);
    
    this.socket = io(socketUrl, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      path: '/socket.io', // Explicitly set the Socket.IO path
    });

    this.setupConnectionEvents();
  }

  // Setup basic connection event handlers
  private setupConnectionEvents(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.connected = true;
      this.emitGlobalEvent('connection-status', true);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error('Failed to connect to real-time server');
      this.connected = false;
      this.emitGlobalEvent('connection-status', false);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.connected = false;
      this.emitGlobalEvent('connection-status', false);
      
      if (reason === 'io server disconnect') {
        // The server has forcefully disconnected the socket
        this.socket?.connect();
      }
    });

    // Set up global event handlers for task events
    this.socket.on('new-task', (task: Task) => {
      console.log('Socket received new-task:', task);
      this.emitGlobalEvent('task-created', task);
    });

    this.socket.on('task-updated', (task: Task) => {
      console.log('Socket received task-updated:', task);
      this.emitGlobalEvent('task-updated', task);
    });

    this.socket.on('task-deleted', (taskId: string) => {
      console.log('Socket received task-deleted:', taskId);
      this.emitGlobalEvent('task-deleted', taskId);
    });
  }

  // Join a project room
  joinProject(projectId: string): void {
    if (!this.socket) {
      this.connect();
    }
    
    console.log(`Joining project room: ${projectId}`);
    this.socket?.emit('join-project', projectId);
  }

  // Leave a project room
  leaveProject(projectId: string): void {
    console.log(`Leaving project room: ${projectId}`);
    this.socket?.emit('leave-project', projectId);
  }

  // Check if socket is connected
  isConnected(): boolean {
    return this.connected && this.socket?.connected === true;
  }

  // Emit a global event to all listeners
  private emitGlobalEvent<K extends keyof EventMap>(event: K, ...args: Parameters<EventMap[K]>): void {
    const listeners = this.globalListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  // Subscribe to a global event
  on<K extends keyof EventMap>(event: K, callback: EventMap[K]): () => void {
    if (!this.globalListeners.has(event)) {
      this.globalListeners.set(event, new Set());
    }
    
    const listeners = this.globalListeners.get(event)!;
    listeners.add(callback as EventCallback);
    
    // Return unsubscribe function
    return () => {
      listeners.delete(callback as EventCallback);
    };
  }

  // Listen for task created events - Legacy method, use 'on' instead
  onTaskCreated(callback: (task: Task) => void): void {
    this.on('task-created', callback);
  }

  // Listen for task updated events - Legacy method, use 'on' instead
  onTaskUpdated(callback: (task: Task) => void): void {
    this.on('task-updated', callback);
  }

  // Listen for task deleted events - Legacy method, use 'on' instead
  onTaskDeleted(callback: (taskId: string) => void): void {
    this.on('task-deleted', callback);
  }

  // Remove all listeners for cleanup
  removeAllListeners(): void {
    if (!this.socket) return;
    
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.socket?.off(event, callback as any);
      });
    });
    
    this.listeners.clear();
    
    // Don't clear global listeners as they might be used by components that are still mounted
  }

  // Disconnect the socket
  disconnect(): void {
    if (!this.socket) return;
    
    this.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
    this.connected = false;
  }
}

// Export a singleton instance
const socketService = new SocketService();
export default socketService; 