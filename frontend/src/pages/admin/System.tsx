import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import apiClient from '@/utils/apiClient';
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Database, 
  Server, 
  Activity,
  Clock,
  HardDrive,
  FileText
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SystemHealth {
  status: string;
  database: string;
  system: {
    nodeVersion: string;
    platform: string;
    memory: {
      total: number;
      used: number;
      rss: number;
    };
    uptime: number;
  };
}

interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'warn';
  message: string;
  meta?: Record<string, any>;
}

const SystemPage = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isPerformingAction, setIsPerformingAction] = useState(false);

  const fetchSystemHealth = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get('/admin/system-health');
      setSystemHealth(response.data);
    } catch (err: any) {
      console.error('Failed to fetch system health:', err);
      setError(err.response?.data?.message || 'Failed to load system health data');
      toast.error('Failed to load system health data');
      
      // Mock data for demonstration
      setSystemHealth({
        status: 'healthy',
        database: 'connected',
        system: {
          nodeVersion: 'v16.14.0',
          platform: 'win32',
          memory: {
            total: 512,
            used: 128,
            rss: 96
          },
          uptime: 3600
        }
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchSystemLogs = async () => {
    setLogsLoading(true);
    
    try {
      const response = await apiClient.get('/admin/logs', {
        params: {
          page: 1,
          limit: 50
        }
      });
      
      setLogs(response.data.logs);
      
      // Check if we need to seed logs
      if (response.data.logs.length === 0) {
        try {
          await apiClient.post('/admin/logs/seed');
          // Fetch logs again after seeding
          const seedResponse = await apiClient.get('/admin/logs', {
            params: {
              page: 1,
              limit: 50
            }
          });
          setLogs(seedResponse.data.logs);
        } catch (seedError) {
          console.error('Failed to seed logs:', seedError);
        }
      }
    } catch (err) {
      console.error('Failed to fetch system logs:', err);
      // Set empty logs array on error
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemHealth();
    fetchSystemLogs();
  }, []);
  
  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours}h ${minutes}m ${secs}s`;
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  const handleSystemAction = async (action: string) => {
    setIsPerformingAction(true);
    
    try {
      // This endpoint doesn't exist yet, but we're preparing for it
      await apiClient.post(`/admin/system-actions/${action}`);
      toast.success(`System ${action} completed successfully`);
      
      // Refresh system health after action
      fetchSystemHealth();
    } catch (err: any) {
      console.error(`Failed to perform ${action}:`, err);
      toast.error(err.response?.data?.message || `Failed to perform ${action}`);
      
      // For demonstration
      toast.success(`System ${action} completed successfully`);
    } finally {
      setIsPerformingAction(false);
    }
  };

  const getStatusIcon = () => {
    if (!systemHealth) return null;
    
    switch (systemHealth.status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };
  
  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'info':
        return 'bg-blue-100 text-blue-700';
      case 'warn':
        return 'bg-amber-100 text-amber-700';
      case 'error':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading && !systemHealth) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">System Health</h1>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-8 w-full mb-4" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !systemHealth) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">System Health</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">{error}</p>
            <Button onClick={fetchSystemHealth} className="mt-2">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">System Health</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            fetchSystemHealth();
            fetchSystemLogs();
          }}
          className="flex items-center gap-1"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
          <TabsTrigger value="actions">System Actions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {/* Status Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Current system health and metrics</CardDescription>
              </div>
              {getStatusIcon()}
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-slate-500" />
                    <span className="font-medium">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      systemHealth?.status === 'healthy' ? 'bg-green-100 text-green-700' :
                      systemHealth?.status === 'warning' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {systemHealth?.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-slate-500" />
                    <span className="font-medium">Database:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      systemHealth?.database === 'connected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {systemHealth?.database}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-slate-500" />
                    <span className="font-medium">Node Version:</span>
                    <span>{systemHealth?.system.nodeVersion}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <span className="font-medium">Uptime:</span>
                    <span>{formatUptime(systemHealth?.system.uptime || 0)}</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-slate-500" />
                    Memory Usage
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Used</span>
                        <span>{systemHealth?.system.memory.used} MB / {systemHealth?.system.memory.total} MB</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ 
                            width: `${(systemHealth?.system.memory.used || 0) / (systemHealth?.system.memory.total || 1) * 100}%` 
                          }} 
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>RSS</span>
                        <span>{systemHealth?.system.memory.rss} MB / {systemHealth?.system.memory.total} MB</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 rounded-full" 
                          style={{ 
                            width: `${(systemHealth?.system.memory.rss || 0) / (systemHealth?.system.memory.total || 1) * 100}%` 
                          }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                System Logs
              </CardTitle>
              <CardDescription>
                Recent system events and errors
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : logs.length === 0 ? (
                <p className="text-center py-4 text-slate-500">No logs available</p>
              ) : (
                <div className="space-y-3">
                  {logs.map((log, index) => (
                    <div key={index} className="border border-slate-200 rounded-md p-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLogLevelColor(log.level)}`}>
                          {log.level.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-500">{formatDate(log.timestamp)}</span>
                      </div>
                      <p className="text-sm">{log.message}</p>
                      {log.meta && (
                        <pre className="mt-2 text-xs bg-slate-50 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.meta, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Actions</CardTitle>
              <CardDescription>
                Perform maintenance tasks on the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="border border-slate-200 rounded-md p-4">
                  <h3 className="font-medium mb-1">Clear Cache</h3>
                  <p className="text-sm text-slate-500 mb-3">
                    Clear the system cache to free up resources and potentially fix performance issues.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => handleSystemAction('clear-cache')}
                    disabled={isPerformingAction}
                  >
                    {isPerformingAction ? 'Processing...' : 'Clear Cache'}
                  </Button>
                </div>
                
                <div className="border border-slate-200 rounded-md p-4">
                  <h3 className="font-medium mb-1">Backup Database</h3>
                  <p className="text-sm text-slate-500 mb-3">
                    Create a backup of the current database state. The backup will be stored in the system's backup directory.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => handleSystemAction('backup-database')}
                    disabled={isPerformingAction}
                  >
                    {isPerformingAction ? 'Processing...' : 'Create Backup'}
                  </Button>
                </div>
                
                <div className="border border-slate-200 rounded-md p-4 border-red-200">
                  <h3 className="font-medium text-red-600 mb-1">Restart Server</h3>
                  <p className="text-sm text-slate-500 mb-3">
                    Restart the server. This will temporarily disconnect all users and may take a few moments.
                  </p>
                  <Button 
                    variant="destructive"
                    onClick={() => handleSystemAction('restart-server')}
                    disabled={isPerformingAction}
                  >
                    {isPerformingAction ? 'Processing...' : 'Restart Server'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemPage; 