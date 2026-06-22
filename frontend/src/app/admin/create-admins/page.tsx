'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Shield,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  UserX,
  UserCheck,
  X,
  Search,
  Loader2,
} from 'lucide-react';
import { AdminAPI, type AdminUserSummary, type AdminUserListItem } from '../utils/adminAPI';
import Loader from '@/app/components/TruckLoader';
import type { RootState } from '@/app/store/store';

function userDisplayName(user: AdminUserListItem): string {
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ');
  return full || user.username;
}

function UserSearchDropdown({
  selectedLabel,
  onSelect,
}: {
  selectedLabel: string;
  onSelect: (user: AdminUserListItem) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AdminUserListItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await AdminAPI.getAllUsers({
          search: query || undefined,
          role: 'user',
          limit: 8,
        });
        if (!cancelled) setResults(response.users);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary" aria-hidden />
        <input
          type="text"
          value={open ? query : selectedLabel}
          onFocus={() => {
            setOpen(true);
            setQuery('');
          }}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, username or email..."
          className="input w-full pl-9"
        />
      </div>

      {open && (
        <div className="absolute z-10 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-border-primary bg-elevated shadow-lg">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-4 text-xs text-secondary">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              Searching...
            </div>
          ) : results.length === 0 ? (
            <p className="py-4 text-center text-xs text-secondary">No users found.</p>
          ) : (
            results.map((user) => (
              <button
                key={user._id}
                type="button"
                onClick={() => {
                  onSelect(user);
                  setOpen(false);
                  setQuery('');
                }}
                className="w-full text-left px-3 py-2 hover:bg-secondary transition-colors flex flex-col"
              >
                <span className="text-sm font-medium text-primary">{userDisplayName(user)}</span>
                <span className="text-xs text-secondary">
                  @{user.username} · {user.emailId}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function EditAdminModal({
  admin,
  onClose,
  onSaved,
}: {
  admin: AdminUserSummary;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [firstName, setFirstName] = useState(admin.firstName);
  const [lastName, setLastName] = useState(admin.lastName ?? '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim()) {
      setError('First name is required');
      return;
    }

    try {
      setSaving(true);
      await AdminAPI.updateUserDetails(admin._id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password: password.trim() || undefined,
      });
      onSaved();
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err as Error).message ??
        'Failed to update admin';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--bg-modal)' }}
    >
      <div className="card bg-elevated border border-border-primary w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primary">Edit admin</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-secondary transition-colors text-secondary"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-primary mb-1">First name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Last name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="input w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              Reset password (optional)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
              className="input w-full"
            />
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CreateAdminsPage() {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [admins, setAdmins] = useState<AdminUserSummary[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [promoteEmail, setPromoteEmail] = useState('');
  const [promoteSelectedLabel, setPromoteSelectedLabel] = useState('');
  const [promoteLoading, setPromoteLoading] = useState(false);
  const [promoteMessage, setPromoteMessage] = useState<string | null>(null);

  const [newAdmin, setNewAdmin] = useState({
    firstName: '',
    lastName: '',
    emailId: '',
    password: '',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createMessage, setCreateMessage] = useState<string | null>(null);

  const [editingAdmin, setEditingAdmin] = useState<AdminUserSummary | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  const pageSize = 20;
  const totalPages = useMemo(() => (total > 0 ? Math.ceil(total / pageSize) : 1), [total]);

  const loadAdmins = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await AdminAPI.getAdmins({ page, limit: pageSize });
      setAdmins(response.admins);
      setTotal(response.total);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err as Error).message ??
        'Failed to load admins';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadAdmins();
  }, [loadAdmins]);

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoteMessage(null);

    if (!promoteEmail.trim()) {
      setPromoteMessage('Select a user to promote');
      return;
    }

    try {
      setPromoteLoading(true);
      const result = await AdminAPI.promoteToAdmin(promoteEmail.trim());
      setPromoteMessage(result.message);
      setPromoteEmail('');
      setPromoteSelectedLabel('');
      await loadAdmins();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err as Error).message ??
        'Failed to promote user';
      setPromoteMessage(message);
    } finally {
      setPromoteLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateMessage(null);

    if (!newAdmin.firstName.trim() || !newAdmin.emailId.trim() || !newAdmin.password.trim()) {
      setCreateMessage('First name, email and password are required');
      return;
    }

    try {
      setCreateLoading(true);
      const result = await AdminAPI.createAdmin({
        firstName: newAdmin.firstName.trim(),
        lastName: newAdmin.lastName.trim() || undefined,
        emailId: newAdmin.emailId.trim(),
        password: newAdmin.password,
      });
      setCreateMessage(result.message);
      setNewAdmin({
        firstName: '',
        lastName: '',
        emailId: '',
        password: '',
      });
      await loadAdmins();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err as Error).message ??
        'Failed to create admin';
      setCreateMessage(message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleActive = async (admin: AdminUserSummary) => {
    setActionError(null);
    setPendingActionId(admin._id);
    try {
      await AdminAPI.toggleUserActive(admin._id);
      await loadAdmins();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to update admin status';
      setActionError(message);
    } finally {
      setPendingActionId(null);
    }
  };

  const handleDelete = async (admin: AdminUserSummary) => {
    const confirmed = window.confirm(
      `Permanently delete ${admin.firstName} ${admin.lastName ?? ''}? This cannot be undone.`
    );
    if (!confirmed) return;

    setActionError(null);
    setPendingActionId(admin._id);
    try {
      await AdminAPI.deleteUser(admin._id);
      await loadAdmins();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to delete admin';
      setActionError(message);
    } finally {
      setPendingActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Shield className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-primary">Admin management</h2>
          <p className="text-sm text-secondary">
            Promote existing users or create brand new admin accounts, and view current
            admins.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-elevated border border-border-primary space-y-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
            <UserPlus className="h-5 w-5 text-brand" aria-hidden />
            Promote existing user
          </h3>
          <form onSubmit={handlePromote} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-primary mb-1">
                Search user
              </label>
              <UserSearchDropdown
                selectedLabel={promoteSelectedLabel}
                onSelect={(user) => {
                  setPromoteEmail(user.emailId);
                  setPromoteSelectedLabel(`${userDisplayName(user)} (${user.emailId})`);
                }}
              />
            </div>
            {promoteMessage && (
              <p
                className={`text-sm ${
                  promoteMessage.toLowerCase().includes('success')
                    ? 'text-success'
                    : 'text-error'
                }`}
              >
                {promoteMessage}
              </p>
            )}
            <button
              type="submit"
              className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm"
              disabled={promoteLoading}
            >
              <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
              {promoteLoading ? 'Promoting...' : 'Promote to admin'}
            </button>
          </form>
        </div>

        <div className="card bg-elevated border border-border-primary space-y-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
            <UserPlus className="h-5 w-5 text-brand" aria-hidden />
            Create new admin
          </h3>
          <form onSubmit={handleCreateAdmin} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  First name
                </label>
                <input
                  type="text"
                  value={newAdmin.firstName}
                  onChange={(e) =>
                    setNewAdmin((prev) => ({ ...prev, firstName: e.target.value }))
                  }
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  Last name
                </label>
                <input
                  type="text"
                  value={newAdmin.lastName}
                  onChange={(e) =>
                    setNewAdmin((prev) => ({ ...prev, lastName: e.target.value }))
                  }
                  className="input w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1">
                Email
              </label>
              <input
                type="email"
                value={newAdmin.emailId}
                onChange={(e) =>
                  setNewAdmin((prev) => ({ ...prev, emailId: e.target.value }))
                }
                className="input w-full"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1">
                Password
              </label>
              <input
                type="password"
                value={newAdmin.password}
                onChange={(e) =>
                  setNewAdmin((prev) => ({ ...prev, password: e.target.value }))
                }
                className="input w-full"
                placeholder="Choose a strong password"
              />
            </div>
            {createMessage && (
              <p
                className={`text-sm ${
                  createMessage.toLowerCase().includes('success')
                    ? 'text-success'
                    : 'text-error'
                }`}
              >
                {createMessage}
              </p>
            )}
            <button
              type="submit"
              className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm"
              disabled={createLoading}
            >
              <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
              {createLoading ? 'Creating...' : 'Create admin'}
            </button>
          </form>
        </div>
      </div>

      <div className="card bg-elevated border border-border-primary">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-primary">Current admins</h3>
          <p className="text-xs text-secondary">
            Showing {admins.length} of {total}
          </p>
        </div>

        {error && <p className="text-sm text-error mb-3">{error}</p>}
        {actionError && <p className="text-sm text-error mb-3">{actionError}</p>}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border-primary text-left">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Username</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Created</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8">
                    <div className="flex flex-col items-center justify-center py-6">
                      <Loader message="Loading admins" submessage="Fetching admin list..." />
                    </div>
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-secondary">
                    No admins found.
                  </td>
                </tr>
              ) : (
                admins.map((admin) => {
                  const isSelf = currentUser?._id === admin._id;
                  const busy = pendingActionId === admin._id;
                  return (
                    <tr key={admin._id} className="border-t border-border-primary">
                      <td className="py-2 pr-4">
                        <span className="font-medium text-primary">
                          {admin.firstName} {admin.lastName}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-secondary">{admin.emailId}</td>
                      <td className="py-2 pr-4 text-secondary">{admin.username}</td>
                      <td className="py-2 pr-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            admin.isActive !== false
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-error/10 text-error border border-error/30'
                          }`}
                        >
                          {admin.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-secondary">
                        {admin.createdAt
                          ? new Date(admin.createdAt).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingAdmin(admin)}
                            disabled={busy}
                            className="btn-secondary inline-flex items-center gap-1 px-2 py-1 text-xs disabled:opacity-40"
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden />
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={isSelf || busy}
                            onClick={() => void handleToggleActive(admin)}
                            title={isSelf ? "You can't deactivate your own account" : undefined}
                            className="btn-secondary inline-flex items-center gap-1 px-2 py-1 text-xs disabled:opacity-40"
                          >
                            {admin.isActive !== false ? (
                              <>
                                <UserX className="h-3.5 w-3.5" aria-hidden />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-3.5 w-3.5" aria-hidden />
                                Activate
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            disabled={isSelf || busy}
                            onClick={() => void handleDelete(admin)}
                            title={isSelf ? "You can't delete your own account" : undefined}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-error/10 text-error border border-error/40 hover:bg-error/20 transition-colors disabled:opacity-40"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-xs text-secondary">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn-secondary inline-flex items-center gap-1 px-2 py-1 text-xs"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
                Previous
              </button>
              <button
                type="button"
                className="btn-secondary inline-flex items-center gap-1 px-2 py-1 text-xs"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </div>
        )}
      </div>

      {editingAdmin && (
        <EditAdminModal
          admin={editingAdmin}
          onClose={() => setEditingAdmin(null)}
          onSaved={() => void loadAdmins()}
        />
      )}
    </div>
  );
}

