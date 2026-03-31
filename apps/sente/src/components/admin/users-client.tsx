/**
 * User Management Client Component
 * Admin panel for managing user accounts
 * @module components/admin/users-client
 */

"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { User } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

const columnHelper = createColumnHelper<User>();

interface UserFormProps {
  formName: string;
  setFormName: (v: string) => void;
  formEmail: string;
  setFormEmail: (v: string) => void;
  formPassword: string;
  setFormPassword: (v: string) => void;
  formRole: string;
  setFormRole: (v: string) => void;
  formError: string;
  loading: boolean;
  onSubmit: () => void;
  submitLabel: string;
  isEdit?: boolean;
}

function UserForm({
  formName, setFormName,
  formEmail, setFormEmail,
  formPassword, setFormPassword,
  formRole, setFormRole,
  formError,
  loading,
  onSubmit,
  submitLabel,
  isEdit = false,
}: UserFormProps) {
  return (
    <div className="space-y-4">
      {formError && (
        <p className="text-sm text-destructive">{formError}</p>
      )}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          placeholder="John Doe"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formEmail}
          onChange={(e) => setFormEmail(e.target.value)}
          placeholder="john@example.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">
          {isEdit ? "New Password" : "Password"}
        </Label>
        <Input
          id="password"
          type="password"
          value={formPassword}
          onChange={(e) => setFormPassword(e.target.value)}
          placeholder={isEdit ? "Leave blank to keep current" : "Min 8 characters"}
        />
        {isEdit && (
          <p className="text-xs text-muted-foreground">
            Only fill this in to change the password
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select value={formRole} onValueChange={setFormRole}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button onClick={onSubmit} disabled={loading}>
          {loading ? "Saving..." : submitLabel}
        </Button>
      </DialogFooter>
    </div>
  );
}

interface UsersClientProps {
  initialUsers: User[];
}

export function UsersClient({ initialUsers }: UsersClientProps) {
  const [users, setUsers] = React.useState<User[]>(initialUsers);
  const [addOpen, setAddOpen] = React.useState(false);
  const [editUser, setEditUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(false);

  // Form state
  const [formName, setFormName] = React.useState("");
  const [formEmail, setFormEmail] = React.useState("");
  const [formRole, setFormRole] = React.useState<string>("viewer");
  const [formPassword, setFormPassword] = React.useState("");
  const [formError, setFormError] = React.useState("");

  const resetForm = () => {
    setFormName("");
    setFormEmail("");
    setFormRole("viewer");
    setFormPassword("");
    setFormError("");
  };

  const openEditDialog = (user: User) => {
    setEditUser(user);
    setFormName(user.name ?? "");
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormPassword("");
    setFormError("");
  };

  const handleCreate = async () => {
    if (!formEmail || !formName) {
      setFormError("Name and email are required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail)) {
      setFormError("Invalid email address");
      return;
    }
    if (!formPassword || formPassword.length < 8) {
      setFormError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_PATH}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, email: formEmail, role: formRole, password: formPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers((prev) => [data.user, ...prev]);
      setAddOpen(false);
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editUser) return;
    if (!formEmail || !formName) {
      setFormError("Name and email are required");
      return;
    }
    if (formPassword && formPassword.length < 8) {
      setFormError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, string> = { name: formName, email: formEmail, role: formRole };
      if (formPassword) payload.password = formPassword;

      const res = await fetch(`${BASE_PATH}/api/users/${editUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers((prev) =>
        prev.map((u) => (u.id === editUser.id ? data.user : u))
      );
      setEditUser(null);
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(`${BASE_PATH}/api/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  const columns = [
    columnHelper.accessor("name", {
      header: "Name",
      cell: (info) => info.getValue() ?? "—",
    }),
    columnHelper.accessor("email", {
      header: "Email",
    }),
    columnHelper.accessor("role", {
      header: "Role",
      cell: (info) => {
        const role = info.getValue();
        const variant =
          role === "admin"
            ? "default"
            : role === "editor"
              ? "secondary"
              : "outline";
        return <Badge variant={variant}>{role}</Badge>;
      },
    }),
    columnHelper.accessor("created_at", {
      header: "Created",
      cell: (info) => {
        const val = info.getValue();
        return val ? new Date(val).toLocaleDateString() : "—";
      },
    }),
    columnHelper.accessor("last_login_at", {
      header: "Last Login",
      cell: (info) => {
        const val = info.getValue();
        return val ? new Date(val).toLocaleDateString() : "Never";
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEditDialog(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.original.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Users</h3>
          <p className="text-sm text-muted-foreground">
            {users.length} user{users.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add User</DialogTitle>
            </DialogHeader>
            <UserForm
              formName={formName} setFormName={setFormName}
              formEmail={formEmail} setFormEmail={setFormEmail}
              formPassword={formPassword} setFormPassword={setFormPassword}
              formRole={formRole} setFormRole={setFormRole}
              formError={formError}
              loading={loading}
              onSubmit={handleCreate}
              submitLabel="Create User"
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) { setEditUser(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <UserForm
            formName={formName} setFormName={setFormName}
            formEmail={formEmail} setFormEmail={setFormEmail}
            formPassword={formPassword} setFormPassword={setFormPassword}
            formRole={formRole} setFormRole={setFormRole}
            formError={formError}
            loading={loading}
            onSubmit={handleUpdate}
            submitLabel="Save Changes"
            isEdit
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
