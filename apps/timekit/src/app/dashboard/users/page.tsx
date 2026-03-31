/**
 * User Management Page
 * Admin interface for managing user export settings
 */

'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Check, X, Plus, Trash2 } from 'lucide-react';

import { Header } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

interface User {
  id: string;
  name: string;
  email: string;
  employeeCode: string | null;
  departmentCode: string | null;
  fncCode: string | null;
}

async function fetchUsers() {
  const response = await fetch(`${BASE_PATH}/api/users`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch users');
  }
  const data = await response.json();
  // Ensure we always return an array
  return (data.data || []) as User[];
}

async function updateUser(
  userId: string,
  data: {
    email: string;
    name: string;
    employeeCode: string;
    departmentCode: string;
    fncCode: string;
  }
) {
  const response = await fetch(`${BASE_PATH}/api/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update user');
  }

  return response.json();
}

async function createUser(data: {
  email: string;
  name: string;
  employeeCode: string;
  departmentCode: string;
  fncCode: string;
}) {
  const response = await fetch(`${BASE_PATH}/api/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create user');
  }

  return response.json();
}

async function deleteUser(userId: string) {
  const response = await fetch(`${BASE_PATH}/api/users/${userId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete user');
  }

  return response.json();
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [editingUserId, setEditingUserId] = React.useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = React.useState<string | null>(null);
  const [isAddingUser, setIsAddingUser] = React.useState(false);
  const [formData, setFormData] = React.useState({
    email: '',
    name: '',
    employeeCode: '',
    departmentCode: '',
    fncCode: '',
  });
  const [error, setError] = React.useState<string | null>(null);

  // Fetch users
  const {
    data: users = [],
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  // Update user mutation
  const updateMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: typeof formData }) =>
      updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUserId(null);
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // Create user mutation
  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsAddingUser(false);
      setFormData({ email: '', name: '', employeeCode: '', departmentCode: '', fncCode: '' });
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeletingUserId(null);
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
      setDeletingUserId(null);
    },
  });

  const handleEdit = (user: User) => {
    setEditingUserId(user.id);
    setFormData({
      email: user.email,
      name: user.name,
      employeeCode: user.employeeCode || '',
      departmentCode: user.departmentCode || '',
      fncCode: user.fncCode || '',
    });
    setError(null);
  };

  const handleAdd = () => {
    setIsAddingUser(true);
    setFormData({
      email: '',
      name: '',
      employeeCode: '',
      departmentCode: '',
      fncCode: '',
    });
    setError(null);
  };

  const handleSave = () => {
    if (isAddingUser) {
      createMutation.mutate(formData);
    } else if (editingUserId) {
      updateMutation.mutate({ userId: editingUserId, data: formData });
    }
  };

  const handleCancel = () => {
    setEditingUserId(null);
    setIsAddingUser(false);
    setError(null);
  };

  const handleDelete = (userId: string) => {
    setDeletingUserId(userId);
    setError(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingUserId) return;
    deleteMutation.mutate(deletingUserId);
  };

  const handleCancelDelete = () => {
    setDeletingUserId(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Header title="User Management" description="Manage user export settings" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Header title="User Management" description="Manage user export settings" />
        <Alert variant="destructive">
          <AlertDescription>Failed to load users. Please try again later.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <Header
        title="User Management"
        description="Manage export settings for all users. Configure employee codes, department codes, and function codes for Advantage time log exports."
      />
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <Button onClick={handleAdd} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full">
              <thead className="bg-muted border-b">
                <tr>
                  <th className="text-muted-foreground px-4 py-3 text-left text-xs font-semibold tracking-[0.05em] uppercase">
                    Name
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-left text-xs font-semibold tracking-[0.05em] uppercase">
                    Email
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-left text-xs font-semibold tracking-[0.05em] uppercase">
                    Employee Code
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-left text-xs font-semibold tracking-[0.05em] uppercase">
                    Department Code
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-left text-xs font-semibold tracking-[0.05em] uppercase">
                    Function Code
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-right text-xs font-semibold tracking-[0.05em] uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {users?.map((user) => (
                  <tr key={user.id} className="hover:bg-muted">
                    <td className="px-4 py-3 text-sm font-medium">{user.name}</td>
                    <td className="text-muted-foreground px-4 py-3 text-sm">{user.email}</td>
                    <td className="px-4 py-3 font-mono text-sm">
                      {user.employeeCode || <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">
                      {user.departmentCode || <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">
                      {user.fncCode || <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users?.length === 0 && (
              <div className="text-muted-foreground py-8 text-center">No users found.</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit/Add Modal */}
      {(editingUserId || isAddingUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>{isAddingUser ? 'Add New User' : 'Edit User'}</CardTitle>
              <CardDescription>
                {isAddingUser
                  ? 'Create a new user with export settings'
                  : `Update settings for ${users?.find((u) => u.id === editingUserId)?.name}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employeeCode">Employee Code (max 6 chars)</Label>
                  <Input
                    id="employeeCode"
                    value={formData.employeeCode}
                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                    maxLength={6}
                    placeholder="e.g., cintra"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="departmentCode">Department Code (max 4 chars)</Label>
                  <Input
                    id="departmentCode"
                    value={formData.departmentCode}
                    onChange={(e) => setFormData({ ...formData, departmentCode: e.target.value })}
                    maxLength={4}
                    placeholder="e.g., pm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fncCode">Function Code (max 10 chars)</Label>
                  <Input
                    id="fncCode"
                    value={formData.fncCode}
                    onChange={(e) => setFormData({ ...formData, fncCode: e.target.value })}
                    maxLength={10}
                    placeholder="e.g., 07cs0326"
                  />
                  <p className="text-muted-foreground text-xs">Used in Advantage export file</p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={updateMutation.isPending || createMutation.isPending}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={updateMutation.isPending || createMutation.isPending}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    {updateMutation.isPending || createMutation.isPending
                      ? isAddingUser
                        ? 'Creating...'
                        : 'Saving...'
                      : isAddingUser
                        ? 'Create User'
                        : 'Save'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {deletingUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Archive User</CardTitle>
              <CardDescription>
                Are you sure you want to archive {users?.find((u) => u.id === deletingUserId)?.name}
                ?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertDescription>
                  This will remove the user from the active list, but all time logs and exports will
                  be preserved for historical records.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancelDelete}
                  disabled={deleteMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Archiving...' : 'Archive User'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
