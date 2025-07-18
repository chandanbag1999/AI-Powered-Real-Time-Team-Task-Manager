import { useState, useEffect } from 'react';
import socketService from '@/utils/socketService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface SocketStatusProps {
  projectId?: string;
  connected?: boolean;
}

const SocketStatus = ({ projectId, connected: externalConnected }: SocketStatusProps) => {
  const [internalConnected, setInternalConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const [lastEventTime, setLastEventTime] = useState<Date | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  // Use the external connected state if provided, otherwise use internal state
  const isConnected = externalConnected !== undefined ? externalConnected : internalConnected;

  const reconnect = () => {
    socketService.disconnect();
    socketService.connect();
    if (projectId) {
      socketService.joinProject(projectId);
    }
    setConnectionAttempts(prev => prev + 1);
  };

  useEffect(() => {
    // Only set up listeners if external connected state is not provided
    if (externalConnected !== undefined) {
      return;
    }

    // Setup socket connection status listener using the new global event system
    const unsubscribeConnection = socketService.on('connection-status', (status) => {
      setInternalConnected(status);
      console.log('SocketStatus: Connection status changed to', status);
    });

    // Set initial connection status
    setInternalConnected(socketService.isConnected());
    
    // Setup event listeners
    const unsubscribeTaskCreated = socketService.on('task-created', () => {
      setLastEvent('new-task');
      setLastEventTime(new Date());
    });
    
    const unsubscribeTaskUpdated = socketService.on('task-updated', () => {
      setLastEvent('task-updated');
      setLastEventTime(new Date());
    });
    
    const unsubscribeTaskDeleted = socketService.on('task-deleted', () => {
      setLastEvent('task-deleted');
      setLastEventTime(new Date());
    });

    // Add listeners
    socketService.connect();
    if (projectId) {
      socketService.joinProject(projectId);
    }

    return () => {
      // Unsubscribe from all event listeners
      unsubscribeConnection();
      unsubscribeTaskCreated();
      unsubscribeTaskUpdated();
      unsubscribeTaskDeleted();
    };
  }, [projectId, connectionAttempts, externalConnected]);

  return (
    <div className="flex items-center gap-2 text-xs">
      <Badge variant={isConnected ? "default" : "destructive"} className="px-2 py-0 h-5">
        {isConnected ? 'Connected' : 'Disconnected'}
      </Badge>
      {!isConnected && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-5 p-0 px-1" 
          onClick={reconnect}
          title="Reconnect"
        >
          <RefreshCw size={14} />
        </Button>
      )}
      {lastEvent && lastEventTime && (
        <span className="text-slate-500">
          Last event: {lastEvent} ({lastEventTime.toLocaleTimeString()})
        </span>
      )}
    </div>
  );
};

export default SocketStatus; 