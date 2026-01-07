import { useState, useEffect } from 'react';
import { authAPI } from '../api/client';
import { useToast } from '../components/ToastProvider';
import type { User, UserRole } from '../types';

export default function Users() {
  const { pushToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetPwUser, setResetPwUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    loadCurrentUser();
    loadUsers();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await authAPI.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const usersList = await authAPI.listUsers();
      setUsers(usersList);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const userData = {
      username: formData.get('username') as string,
      email: formData.get('email') as string,
      full_name: formData.get('full_name') as string,
      password: formData.get('password') as string,
      role: formData.get('role') as UserRole,
    };

    try {
      const newUser = await authAPI.register(userData);
      setShowForm(false);
      setUsers([...users, newUser]);
      e.currentTarget.reset();
      pushToast({ variant: 'success', title: 'User created' });
    } catch (error: any) {
      console.error('Failed to create user:', error);
      pushToast({
        variant: 'error',
        title: 'Failed to create user',
        message: error.response?.data?.detail || 'Please try again.',
      });
    }
  };

  const getRoleLabel = (role: UserRole) => {
    const labels: Record<UserRole, string> = {
      admin: 'Admin',
      warehouse_manager: 'Warehouse Manager',
      outreach_coordinator: 'Outreach Coordinator',
      in_house_production_coordinator: 'In-House Production Coordinator',
      product_purchaser: 'Product Purchaser',
    };
    return labels[role];
  };

  const getRoleColor = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      admin: 'bg-purple-100 text-purple-800',
      warehouse_manager: 'bg-blue-100 text-blue-800',
      outreach_coordinator: 'bg-[#5FA8A6]/20 text-[#5FA8A6]',
      in_house_production_coordinator: 'bg-[#A8B968]/20 text-[#A8B968]',
      product_purchaser: 'bg-[#D9896C]/20 text-[#D9896C]',
    };
    return colors[role];
  };

  const isAdmin = currentUser?.role === 'admin';

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;

    const formData = new FormData(e.currentTarget);
    const payload = {
      email: (formData.get('email') as string) || undefined,
      full_name: (formData.get('full_name') as string) || undefined,
      role: (formData.get('role') as string) || undefined,
      is_active: formData.get('is_active') === 'on',
    };

    try {
      const updated = await authAPI.updateUser(editingUser.id, payload);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setEditingUser(null);
      pushToast({ variant: 'success', title: 'User updated' });
    } catch (error: any) {
      console.error('Failed to update user:', error);
      pushToast({
        variant: 'error',
        title: 'Failed to update user',
        message: error.response?.data?.detail || 'Please try again.',
      });
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!resetPwUser) return;

    const formData = new FormData(e.currentTarget);
    const pw = (formData.get('new_password') as string) || '';
    const pw2 = (formData.get('confirm_password') as string) || '';

    if (pw.length < 6) {
      pushToast({ variant: 'error', title: 'Password too short', message: 'Minimum 6 characters.' });
      return;
    }

    if (pw !== pw2) {
      pushToast({ variant: 'error', title: 'Passwords do not match' });
      return;
    }

    const ok = window.confirm(`Reset password for ${resetPwUser.full_name || resetPwUser.username}?`);
    if (!ok) return;

    try {
      await authAPI.adminResetPassword(resetPwUser.id, pw);
      setResetPwUser(null);
      pushToast({ variant: 'success', title: 'Password reset' });
    } catch (error: any) {
      console.error('Failed to reset password:', error);
      pushToast({
        variant: 'error',
        title: 'Failed to reset password',
        message: error.response?.data?.detail || 'Please try again.',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5FA8A6]"></div>
        <p className="mt-4 text-gray-600">Loading users...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">Access Restricted</h2>
          <p className="text-yellow-700">Only administrators can manage users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold text-gray-900">User Management</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#5FA8A6] text-white px-6 py-3 rounded-lg hover:bg-[#52918F] font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New User
          </button>
        </div>
        <p className="text-gray-600">Create and manage user accounts with different roles and permissions</p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">User Activity Tracking</h3>
            <p className="text-sm text-blue-800">
              All production, purchase, and distribution actions are automatically tracked with the user who performed them. 
              This creates a complete audit trail in the database for accountability and reporting.
            </p>
          </div>
        </div>
      </div>

      {/* Add User Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-[#5FA8A6]">
          <h2 className="text-2xl font-semibold mb-4">Add New User</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Username *</label>
                <input
                  type="text"
                  name="username"
                  required
                  className="w-full border rounded-lg p-2"
                  placeholder="e.g., jsmith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  name="full_name"
                  required
                  className="w-full border rounded-lg p-2"
                  placeholder="e.g., John Smith"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full border rounded-lg p-2"
                  placeholder="user@nation-to-nation.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role *</label>
                <select
                  name="role"
                  required
                  className="w-full border rounded-lg p-2"
                >
                  <option value="">Select role...</option>
                  <option value="admin">Admin (Full access)</option>
                  <option value="warehouse_manager">Warehouse Manager (Inventory + fulfillment)</option>
                  <option value="outreach_coordinator">Outreach Coordinator (Full access)</option>
                  <option value="in_house_production_coordinator">In-House Production Coordinator</option>
                  <option value="product_purchaser">Product Purchaser</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password *</label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                className="w-full border rounded-lg p-2"
                placeholder="Minimum 6 characters"
              />
              <p className="text-xs text-gray-500 mt-1">User can change this password after first login</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-sm mb-2">Role Permissions:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><strong>Admin:</strong> Full access (including user management)</li>
                <li><strong>Warehouse Manager:</strong> Inventory fulfillment and distribution</li>
                <li><strong>Outreach Coordinator:</strong> Full access</li>
                <li><strong>In-House Production Coordinator:</strong> Receive order, record production, move completed product to warehouse</li>
                <li><strong>Product Purchaser:</strong> Receive order, record purchase in inventory including cost/pc</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                className="bg-[#5FA8A6] text-white px-6 py-2 rounded-lg hover:bg-[#52918F] font-medium"
              >
                Create User
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Active Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-700">User</th>
                <th className="text-left p-4 font-semibold text-gray-700">Email</th>
                <th className="text-left p-4 font-semibold text-gray-700">Role</th>
                <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                <th className="text-right p-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-gray-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">{user.email}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingUser(user)}
                          className="text-[#5FA8A6] hover:text-[#52918F] px-3 py-1 rounded border"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setResetPwUser(user)}
                          className="text-[#D9896C] hover:text-[#C77A5F] px-3 py-1 rounded border"
                        >
                          Reset Password
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[1000] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-lg border">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">Edit User</div>
                <div className="text-sm text-gray-600">@{editingUser.username}</div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full name</label>
                <input
                  type="text"
                  name="full_name"
                  defaultValue={editingUser.full_name || ''}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={editingUser.email}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select name="role" defaultValue={editingUser.role} className="w-full border rounded-lg p-2">
                  <option value="admin">Admin</option>
                  <option value="warehouse_manager">Warehouse Manager</option>
                  <option value="outreach_coordinator">Outreach Coordinator</option>
                  <option value="in_house_production_coordinator">In-House Production Coordinator</option>
                  <option value="product_purchaser">Product Purchaser</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input id="is_active" name="is_active" type="checkbox" defaultChecked={editingUser.is_active} />
                <label htmlFor="is_active" className="text-sm">Active</label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#5FA8A6] text-white px-4 py-2 rounded-lg hover:bg-[#52918F] font-medium"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPwUser && (
        <div className="fixed inset-0 z-[1000] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-lg border">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">Reset Password</div>
                <div className="text-sm text-gray-600">@{resetPwUser.username}</div>
              </div>
              <button
                type="button"
                onClick={() => setResetPwUser(null)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="p-4 space-y-4">
              <div className="text-sm text-gray-700">
                This will immediately replace the user&apos;s password.
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">New password</label>
                <input
                  type="password"
                  name="new_password"
                  minLength={6}
                  required
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Confirm new password</label>
                <input
                  type="password"
                  name="confirm_password"
                  minLength={6}
                  required
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPwUser(null)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#D9896C] text-white px-4 py-2 rounded-lg hover:bg-[#C77A5F] font-medium"
                >
                  Reset password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activity Tracking Info */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-3">Activity Tracking</h3>
        <p className="text-gray-600 mb-4">
          Every action in the system is tracked with the user who performed it:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#A8B968]/10 rounded-lg p-4">
            <h4 className="font-medium text-[#A8B968] mb-2">Production Records</h4>
            <p className="text-sm text-gray-600">Tracks who manufactured each batch</p>
          </div>
          <div className="bg-[#D9896C]/10 rounded-lg p-4">
            <h4 className="font-medium text-[#D9896C] mb-2">Purchase Records</h4>
            <p className="text-sm text-gray-600">Tracks who received supplies</p>
          </div>
          <div className="bg-[#5FA8A6]/10 rounded-lg p-4">
            <h4 className="font-medium text-[#5FA8A6] mb-2">Distribution Records</h4>
            <p className="text-sm text-gray-600">Tracks who distributed items</p>
          </div>
        </div>
      </div>
    </div>
  );
}
