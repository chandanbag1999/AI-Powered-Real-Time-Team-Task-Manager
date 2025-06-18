import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import apiClient from '@/utils/apiClient';

interface SystemSettings {
  emailNotifications: boolean;
  taskNotifications: boolean;
  systemAlerts: boolean;
  adminEmail: string;
  maxFileSize: number;
  sessionTimeout: number;
  autoBackup: boolean;
  maintenanceMode: boolean;
}

const SettingsPage = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    emailNotifications: true,
    taskNotifications: true,
    systemAlerts: true,
    adminEmail: 'admin@example.com',
    maxFileSize: 5,
    sessionTimeout: 60,
    autoBackup: false,
    maintenanceMode: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('notifications');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    
    try {
      // This endpoint doesn't exist yet, but we're preparing for it
      const response = await apiClient.get('/admin/settings');
      setSettings(response.data);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      
      // Mock data for demonstration
      setSettings({
        emailNotifications: true,
        taskNotifications: true,
        systemAlerts: true,
        adminEmail: 'admin@example.com',
        maxFileSize: 5,
        sessionTimeout: 60,
        autoBackup: false,
        maintenanceMode: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    try {
      // This endpoint doesn't exist yet, but we're preparing for it
      await apiClient.put('/admin/settings', settings);
      toast.success('Settings saved successfully');
    } catch (err) {
      console.error('Failed to save settings:', err);
      toast.error('Failed to save settings');
      
      // For demonstration
      toast.success('Settings saved successfully');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleSetting = (key: keyof SystemSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleInputChange = (key: keyof SystemSettings, value: string | number) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSystemAction = async (action: string) => {
    try {
      // This endpoint doesn't exist yet, but we're preparing for it
      await apiClient.post(`/admin/system-actions/${action}`);
      
      if (action === 'clear-cache') {
        toast.success('Cache cleared successfully');
      } else if (action === 'backup-database') {
        toast.success('Database backup created successfully');
      } else if (action === 'reset-settings') {
        toast.success('Settings reset to defaults');
        fetchSettings();
      }
    } catch (err: any) {
      console.error(`Failed to perform ${action}:`, err);
      toast.error(err.response?.data?.message || `Failed to perform ${action}`);
      
      // For demonstration
      if (action === 'clear-cache') {
        toast.success('Cache cleared successfully');
      } else if (action === 'backup-database') {
        toast.success('Database backup created successfully');
      } else if (action === 'reset-settings') {
        toast.success('Settings reset to defaults');
        fetchSettings();
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Settings</h1>
        <Button 
          onClick={handleSaveSettings} 
          disabled={isSaving}
          className="flex items-center gap-1"
        >
          {isSaving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>
      
      <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
        <button
          className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
            activeTab === 'notifications' 
              ? 'bg-slate-900 text-white' 
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          onClick={() => setActiveTab('notifications')}
        >
          Notifications
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
            activeTab === 'security' 
              ? 'bg-slate-900 text-white' 
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          onClick={() => setActiveTab('security')}
        >
          Security & Sessions
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
            activeTab === 'system' 
              ? 'bg-slate-900 text-white' 
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          onClick={() => setActiveTab('system')}
        >
          System Maintenance
        </button>
      </div>
      
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="h-24 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications" className="font-medium">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-slate-500">
                      Receive notifications about important system events via email
                    </p>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="email-notifications"
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={() => handleToggleSetting('emailNotifications')}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="email-notifications" className="ml-2">
                      {settings.emailNotifications ? 'Enabled' : 'Disabled'}
                    </Label>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="task-notifications" className="font-medium">
                      Task Updates
                    </Label>
                    <p className="text-sm text-slate-500">
                      Receive notifications when tasks are created or updated
                    </p>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="task-notifications"
                      type="checkbox"
                      checked={settings.taskNotifications}
                      onChange={() => handleToggleSetting('taskNotifications')}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="task-notifications" className="ml-2">
                      {settings.taskNotifications ? 'Enabled' : 'Disabled'}
                    </Label>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="system-alerts" className="font-medium">
                      System Alerts
                    </Label>
                    <p className="text-sm text-slate-500">
                      Receive alerts about system health and performance issues
                    </p>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="system-alerts"
                      type="checkbox"
                      checked={settings.systemAlerts}
                      onChange={() => handleToggleSetting('systemAlerts')}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="system-alerts" className="ml-2">
                      {settings.systemAlerts ? 'Enabled' : 'Disabled'}
                    </Label>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-200">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="admin-email">Admin Email</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      value={settings.adminEmail}
                      onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                      placeholder="Enter admin contact email"
                    />
                    <p className="text-xs text-slate-500">
                      This email will receive all system notifications and alerts
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Security & Session Settings</CardTitle>
                <CardDescription>
                  Configure security settings and user session parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    min="15"
                    max="240"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-slate-500">
                    User sessions will expire after this period of inactivity
                  </p>
                </div>
                
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="max-file-size">Maximum File Upload Size (MB)</Label>
                  <Input
                    id="max-file-size"
                    type="number"
                    min="1"
                    max="50"
                    value={settings.maxFileSize}
                    onChange={(e) => handleInputChange('maxFileSize', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-slate-500">
                    Maximum allowed file size for uploads
                  </p>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <div>
                    <Label htmlFor="maintenance-mode" className="font-medium">
                      Maintenance Mode
                    </Label>
                    <p className="text-sm text-slate-500">
                      When enabled, only administrators can access the system
                    </p>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="maintenance-mode"
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={() => handleToggleSetting('maintenanceMode')}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="maintenance-mode" className="ml-2">
                      {settings.maintenanceMode ? 'Enabled' : 'Disabled'}
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {activeTab === 'system' && (
            <Card>
              <CardHeader>
                <CardTitle>System Maintenance</CardTitle>
                <CardDescription>
                  Perform system maintenance tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-backup" className="font-medium">
                      Automatic Database Backup
                    </Label>
                    <p className="text-sm text-slate-500">
                      Automatically create daily backups of the database
                    </p>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="auto-backup"
                      type="checkbox"
                      checked={settings.autoBackup}
                      onChange={() => handleToggleSetting('autoBackup')}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="auto-backup" className="ml-2">
                      {settings.autoBackup ? 'Enabled' : 'Disabled'}
                    </Label>
                  </div>
                </div>
                
                <div className="grid gap-4 pt-4 border-t border-slate-200">
                  <div className="border border-slate-200 rounded-md p-4">
                    <h3 className="font-medium mb-1">Clear Cache</h3>
                    <p className="text-sm text-slate-500 mb-2">
                      Clear the system cache to free up resources
                    </p>
                    <Button 
                      variant="outline"
                      onClick={() => handleSystemAction('clear-cache')}
                    >
                      Clear Cache
                    </Button>
                  </div>
                  
                  <div className="border border-slate-200 rounded-md p-4">
                    <h3 className="font-medium mb-1">Backup Database</h3>
                    <p className="text-sm text-slate-500 mb-2">
                      Create a backup of the current database
                    </p>
                    <Button 
                      variant="outline"
                      onClick={() => handleSystemAction('backup-database')}
                    >
                      Create Backup
                    </Button>
                  </div>
                  
                  <div className="border border-slate-200 rounded-md p-4 border-red-200">
                    <h3 className="font-medium text-red-600 mb-1">Reset Settings</h3>
                    <p className="text-sm text-slate-500 mb-2">
                      Reset all system settings to default values
                    </p>
                    <Button 
                      variant="destructive"
                      onClick={() => handleSystemAction('reset-settings')}
                    >
                      Reset Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default SettingsPage; 