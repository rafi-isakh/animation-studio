"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import CreditsPage from '@/components/Mithril/CreditsPage';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcnUI/Card';
import { Button } from '@/components/shadcnUI/Button';
import { Badge } from '@/components/shadcnUI/Badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcnUI/Table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcnUI/Dialog';
import { Input } from '@/components/shadcnUI/Input';
import { Label } from '@/components/shadcnUI/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcnUI/Select';
import {
  UserPlus,
  Edit,
  Trash2,
  Key,
  Shield,
  User as UserIcon,
  CreditCard,
} from 'lucide-react';
import { AdminAuthGate } from '@/components/Mithril/auth';
import { useMithrilAuth } from '@/components/Mithril/auth';
import MithrilHeader from '@/components/Mithril/MithrilHeader';
import type { MithrilUserRole } from '@/components/Mithril/services/firestore/types';

interface AdminUser {
  id: string;
  email: string;
  role: MithrilUserRole;
  displayName: string;
  isActive: boolean;
  createdAt: string | null;
  lastLoginAt: string | null;
}

function formatDate(isoString: string | null): string {
  if (!isoString) return 'Never';
  return new Date(isoString).toLocaleDateString();
}

type AdminTab = 'users' | 'credits';

export default function AdminPage() {
  return (
    <AdminAuthGate>
      <AdminContent />
    </AdminAuthGate>
  );
}

function AdminContent() {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  return (
    <div className="min-h-screen bg-[#f0f4f9] dark:bg-[#111]">
      <MithrilHeader />
      <div className="px-12 pt-20 pb-2">
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === 'users'
                ? 'border-[#DB2777] text-[#DB2777]'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Shield className="w-4 h-4" />
            User Management
          </button>
          <button
            onClick={() => setActiveTab('credits')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === 'credits'
                ? 'border-[#DB2777] text-[#DB2777]'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Credits
          </button>
        </div>
      </div>
      {activeTab === 'users' ? (
        <div className="px-12 pb-8">
          <UserManagementContent />
        </div>
      ) : (
        <Suspense fallback={<div className="p-8 text-gray-400">Loading...</div>}>
          <CreditsPage hideHeader adminMode />
        </Suspense>
      )}
    </div>
  );
}

function UserManagementContent() {
  const { user: currentUser } = useMithrilAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create user state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'user' as MithrilUserRole,
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit user state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({
    displayName: '',
    role: 'user' as MithrilUserRole,
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Reset password state
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetUser, setResetUser] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/mithril/admin/users');
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
      } else {
        setError(data.error || 'Failed to load users');
      }
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);

    try {
      setCreateLoading(true);
      const response = await fetch('/api/mithril/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });

      const data = await response.json();

      if (response.ok) {
        setIsCreateOpen(false);
        setCreateForm({ email: '', password: '', displayName: '', role: 'user' });
        await loadUsers();
      } else {
        setCreateError(data.error || 'Failed to create user');
      }
    } catch {
      setCreateError('An error occurred');
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setEditError(null);

    try {
      setEditLoading(true);
      const response = await fetch(`/api/mithril/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (response.ok) {
        setIsEditOpen(false);
        setEditingUser(null);
        await loadUsers();
      } else {
        setEditError(data.error || 'Failed to update user');
      }
    } catch {
      setEditError('An error occurred');
    } finally {
      setEditLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetUser) return;
    setResetError(null);

    try {
      setResetLoading(true);
      const response = await fetch(`/api/mithril/admin/users/${resetUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsResetOpen(false);
        setResetUser(null);
        setNewPassword('');
      } else {
        setResetError(data.error || 'Failed to reset password');
      }
    } catch {
      setResetError('An error occurred');
    } finally {
      setResetLoading(false);
    }
  }

  async function handleToggleActive(user: AdminUser) {
    try {
      const response = await fetch(`/api/mithril/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      const data = await response.json();

      if (response.ok) {
        await loadUsers();
      } else {
        alert(data.error || 'Failed to update user');
      }
    } catch {
      alert('An error occurred');
    }
  }

  async function handleDelete(user: AdminUser) {
    if (
      !confirm(
        `Are you sure you want to delete "${user.displayName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/mithril/admin/users/${user.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        await loadUsers();
      } else {
        alert(data.error || 'Failed to delete user');
      }
    } catch {
      alert('An error occurred');
    }
  }

  function openEdit(user: AdminUser) {
    setEditingUser(user);
    setEditForm({ displayName: user.displayName, role: user.role });
    setEditError(null);
    setIsEditOpen(true);
  }

  function openReset(user: AdminUser) {
    setResetUser(user);
    setNewPassword('');
    setResetError(null);
    setIsResetOpen(true);
  }

  const isSelf = (userId: string) => currentUser?.id === userId;

  return (
    <>
        <Card className="dark:bg-[#211F21] dark:border-gray-800">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Shield className="w-6 h-6 text-[#DB2777]" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Manage Mithril user accounts
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  setCreateForm({ email: '', password: '', displayName: '', role: 'user' });
                  setCreateError(null);
                  setIsCreateOpen(true);
                }}
                className="bg-[#DB2777] hover:bg-[#BE185D]"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Create User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-[#DB2777] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.displayName}
                        {isSelf(user.id) && (
                          <span className="ml-2 text-xs text-gray-400">(you)</span>
                        )}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={user.role === 'admin' ? 'default' : 'secondary'}
                          className={
                            user.role === 'admin' ? 'bg-[#DB2777]' : ''
                          }
                        >
                          {user.role === 'admin' ? (
                            <>
                              <Shield className="w-3 h-3 mr-1" /> Admin
                            </>
                          ) : (
                            <>
                              <UserIcon className="w-3 h-3 mr-1" /> User
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.isActive ? 'default' : 'destructive'}
                          className={user.isActive ? 'bg-green-600' : ''}
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {formatDate(user.lastLoginAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(user)}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openReset(user)}
                          >
                            <Key className="w-3 h-3 mr-1" />
                            Password
                          </Button>
                          {!isSelf(user.id) && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleActive(user)}
                              >
                                {user.isActive ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(user)}
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="dark:bg-[#211F21]">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>Add a new user account</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {createError && (
                <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                  {createError}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="create-email">Email</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-name">Display Name</Label>
                <Input
                  id="create-name"
                  value={createForm.displayName}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, displayName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-password">Password</Label>
                <Input
                  id="create-password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, password: e.target.value })
                  }
                  minLength={8}
                  required
                />
                <p className="text-xs text-gray-500">Minimum 8 characters</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-role">Role</Label>
                <Select
                  value={createForm.role}
                  onValueChange={(value: MithrilUserRole) =>
                    setCreateForm({ ...createForm, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[9999]">
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createLoading}
                className="bg-[#DB2777] hover:bg-[#BE185D]"
              >
                {createLoading ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="dark:bg-[#211F21]">
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update {editingUser?.displayName}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {editError && (
                <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                  {editError}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Display Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.displayName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, displayName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(value: MithrilUserRole) =>
                    setEditForm({ ...editForm, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[9999]">
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={editLoading}
                className="bg-[#DB2777] hover:bg-[#BE185D]"
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="dark:bg-[#211F21]">
          <form onSubmit={handleResetPassword}>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Set a new password for {resetUser?.displayName}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {resetError && (
                <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                  {resetError}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="reset-password">New Password</Label>
                <Input
                  id="reset-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  required
                />
                <p className="text-xs text-gray-500">Minimum 8 characters</p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsResetOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={resetLoading}
                className="bg-[#DB2777] hover:bg-[#BE185D]"
              >
                {resetLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
