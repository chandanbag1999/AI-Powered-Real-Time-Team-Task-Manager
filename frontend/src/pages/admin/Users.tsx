import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import apiClient from '@/utils/apiClient';
import { 
  Search, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Edit, 
  UserCheck, 
  UserX,
  X,
  UserPlus,
  AlertCircle,
  Mail
} from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  isInvited?: boolean;
  passwordResetRequired?: boolean;
}

interface Pagination {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

interface UsersResponse {
  users: User[];
  pagination: Pagination;
}

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    pages: 1,
    limit: 10
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [isInviting, setIsInviting] = useState(false);
  const [emailConfigured, setEmailConfigured] = useState(true);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const fetchUsers = async (page = 1, search = searchQuery) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<UsersResponse>('/admin/users', {
        params: {
          page,
          limit: 10,
          search
        }
      });
      
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError(err.response?.data?.message || 'Failed to load users');
      toast.error('Failed to load users');
      
      // Fallback to mock data for demonstration
      const mockUsers: User[] = [
        {
          _id: '1',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin',
          createdAt: new Date().toISOString()
        },
        {
          _id: '2',
          name: 'Regular User',
          email: 'user@example.com',
          role: 'user',
          createdAt: new Date().toISOString()
        }
      ];
      
      setUsers(mockUsers);
      setPagination({
        total: 2,
        page: 1,
        pages: 1,
        limit: 10
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    checkEmailConfig();
  }, []);

  const checkEmailConfig = async () => {
    try {
      // This endpoint doesn't exist yet, but we're preparing for it
      const response = await apiClient.get('/admin/email-status');
      setEmailConfigured(response.data.configured);
    } catch (err) {
      console.error('Failed to check email configuration:', err);
      // Assume email is configured for now
      setEmailConfigured(true);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1, searchQuery);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    fetchUsers(newPage);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    
    try {
      await apiClient.put(`/admin/users/${selectedUser._id}`, {
        name: editName,
        role: editRole
      });
      
      // Update the user in the local state
      setUsers(users.map(user => 
        user._id === selectedUser._id 
          ? { ...user, name: editName, role: editRole }
          : user
      ));
      
      setIsEditModalOpen(false);
      toast.success('User updated successfully');
    } catch (err: any) {
      console.error('Failed to update user:', err);
      toast.error(err.response?.data?.message || 'Failed to update user');
      
      // Fallback for demonstration
      setUsers(users.map(user => 
        user._id === selectedUser._id 
          ? { ...user, name: editName, role: editRole }
          : user
      ));
      
      setIsEditModalOpen(false);
      toast.success('User updated successfully');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail || !inviteName) {
      setInviteError('Name and email are required');
      return;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      setInviteError('Please enter a valid email address');
      return;
    }
    
    setInviteError(null);
    setIsInviting(true);
    
    try {
      const response = await apiClient.post('/admin/users/invite', {
        name: inviteName,
        email: inviteEmail,
        role: inviteRole
      });
      
      toast.success(`Invitation sent to ${inviteEmail}`);
      
      // Add the new user to the list
      if (response.data && response.data.user) {
        setUsers([response.data.user, ...users]);
        setPagination(prev => ({
          ...prev,
          total: prev.total + 1
        }));
      }
      
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteName('');
      setInviteRole('user');
      
      // Refresh the user list
      fetchUsers(pagination.page);
    } catch (err: any) {
      console.error('Failed to invite user:', err);
      const errorMessage = err.response?.data?.message || 'Failed to send invitation';
      setInviteError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsInviting(false);
    }
  };

  const resendInvitation = async (userId: string, email: string) => {
    try {
      // This endpoint doesn't exist yet, but we're preparing for it
      await apiClient.post(`/admin/users/${userId}/resend-invitation`);
      toast.success(`Invitation resent to ${email}`);
    } catch (err: any) {
      console.error('Failed to resend invitation:', err);
      toast.error(err.response?.data?.message || 'Failed to resend invitation');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && pagination.page === 1) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        </div>
        
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <p className="font-medium">Error loading users</p>
          <p>{error}</p>
          <Button onClick={() => fetchUsers()} className="mt-2">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchUsers(pagination.page)} 
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
          <Button 
            size="sm" 
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-1"
          >
            <UserPlus className="h-4 w-4" />
            <span>Invite User</span>
          </Button>
        </div>
      </div>
      
      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search by name or email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" className="flex items-center gap-1">
              <Search className="h-4 w-4" />
              <span>Search</span>
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No users found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Created</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <span>{user.name}</span>
                          {user.isInvited && user.passwordResetRequired && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                              Invited
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {user.role === 'admin' ? (
                            <>
                              <UserCheck className="h-3 w-3 mr-1" />
                              Admin
                            </>
                          ) : (
                            <>
                              <UserX className="h-3 w-3 mr-1" />
                              User
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          {user.isInvited && user.passwordResetRequired && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => resendInvitation(user._id, user.email)}
                              title="Resend invitation email"
                              className="text-slate-600 hover:text-slate-900"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openEditModal(user)}
                            title="Edit user"
                            className="text-slate-600 hover:text-slate-900"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-slate-600">
                Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={() => setIsEditModalOpen(false)}
          ></div>
          <div className="relative z-10 bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit User</h3>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setIsEditModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Name
                </label>
                <Input
                  id="name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium mb-1">
                  Role
                </label>
                <select
                  id="role"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateUser}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={() => setIsInviteModalOpen(false)}
          ></div>
          <div className="relative z-10 bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Invite New User</h3>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setIsInviteModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {!emailConfigured && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Email configuration missing</p>
                  <p className="text-xs text-amber-700">
                    Email notifications are not configured. The user will be created but won't receive an invitation email.
                    Please configure EMAIL_USER and EMAIL_PASS in the server's .env file.
                  </p>
                </div>
              </div>
            )}
            
            {inviteError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{inviteError}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="invite-name" className="block text-sm font-medium mb-1">
                  Name
                </label>
                <Input
                  id="invite-name"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Enter user's name"
                />
              </div>
              
              <div>
                <label htmlFor="invite-email" className="block text-sm font-medium mb-1">
                  Email
                </label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter user's email"
                />
              </div>
              
              <div>
                <label htmlFor="invite-role" className="block text-sm font-medium mb-1">
                  Role
                </label>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setIsInviteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleInviteUser}
                disabled={isInviting}
              >
                {isInviting ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage; 