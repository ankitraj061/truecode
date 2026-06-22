'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Users, ChevronLeft, ChevronRight, Search, ShieldCheck, ShieldOff, UserX, UserCheck } from 'lucide-react';
import { AdminAPI, type AdminUserListItem } from '../utils/adminAPI';
import Loader from '@/app/components/TruckLoader';
import type { RootState } from '@/app/store/store';

type RoleFilter = 'all' | 'admin' | 'user';
type ActiveFilter = 'all' | 'active' | 'inactive';

export default function ManageUsersPage() {
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');

  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  const pageSize = 20;
  const totalPages = useMemo(() => (total > 0 ? Math.ceil(total / pageSize) : 1), [total]);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await AdminAPI.getAllUsers({
        page,
        limit: pageSize,
        search: search || undefined,
        role: roleFilter === 'all' ? undefined : roleFilter,
        isActive: activeFilter === 'all' ? undefined : activeFilter === 'active',
      });
      setUsers(response.users);
      setTotal(response.total);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err as Error).message ??
        'Failed to load users';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, activeFilter]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleToggleActive = async (user: AdminUserListItem) => {
    setActionError(null);
    setPendingActionId(user._id);
    try {
      await AdminAPI.toggleUserActive(user._id);
      await loadUsers();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to update user status';
      setActionError(message);
    } finally {
      setPendingActionId(null);
    }
  };

  const handleToggleRole = async (user: AdminUserListItem) => {
    setActionError(null);
    setPendingActionId(user._id);
    try {
      await AdminAPI.updateUserRole(user._id, user.role === 'admin' ? 'user' : 'admin');
      await loadUsers();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to update user role';
      setActionError(message);
    } finally {
      setPendingActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Users className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-primary">Manage users</h2>
          <p className="text-sm text-secondary">
            Search all users, toggle account access, and change roles.
          </p>
        </div>
      </div>

      <div className="card bg-elevated border border-border-primary space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[220px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary" aria-hidden />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, email or username..."
                className="input w-full pl-9"
              />
            </div>
            <button type="submit" className="btn-secondary px-3 py-2 text-sm">
              Search
            </button>
          </form>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as RoleFilter);
              setPage(1);
            }}
            className="input text-sm py-2"
          >
            <option value="all">All roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value as ActiveFilter);
              setPage(1);
            }}
            className="input text-sm py-2"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {!loading && !error && (
          <p className="text-xs text-secondary">
            Showing {users.length} of {total} user{total !== 1 ? 's' : ''}
          </p>
        )}

        {error && <p className="text-sm text-error">{error}</p>}
        {actionError && <p className="text-sm text-error">{actionError}</p>}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border-primary text-left">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Username</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Plan</th>
                <th className="py-2 pr-4">Joined</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8">
                    <div className="flex flex-col items-center justify-center py-6">
                      <Loader message="Loading users" submessage="Fetching user list..." />
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-secondary">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = currentUser?._id === u._id;
                  const busy = pendingActionId === u._id;
                  return (
                    <tr key={u._id} className="border-t border-border-primary">
                      <td className="py-2 pr-4">
                        <span className="font-medium text-primary">
                          {u.firstName} {u.lastName}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-secondary">{u.emailId}</td>
                      <td className="py-2 pr-4 text-secondary">{u.username}</td>
                      <td className="py-2 pr-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            u.role === 'admin'
                              ? 'bg-brand/10 text-brand border border-brand/30'
                              : 'bg-secondary/40 text-secondary border border-border-primary'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            u.isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-error/10 text-error border border-error/30'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-secondary capitalize">{u.subscriptionType}</td>
                      <td className="py-2 pr-4 text-secondary">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isSelf || busy}
                            onClick={() => void handleToggleActive(u)}
                            title={isSelf ? "You can't deactivate your own account" : undefined}
                            className="btn-secondary inline-flex items-center gap-1 px-2 py-1 text-xs disabled:opacity-40"
                          >
                            {u.isActive ? (
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
                            onClick={() => void handleToggleRole(u)}
                            title={isSelf ? "You can't change your own role" : undefined}
                            className="btn-secondary inline-flex items-center gap-1 px-2 py-1 text-xs disabled:opacity-40"
                          >
                            {u.role === 'admin' ? (
                              <>
                                <ShieldOff className="h-3.5 w-3.5" aria-hidden />
                                Demote
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                                Promote
                              </>
                            )}
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
                className="btn-secondary inline-flex items-center gap-1 px-2 py-1 text-xs disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
                Previous
              </button>
              <button
                type="button"
                className="btn-secondary inline-flex items-center gap-1 px-2 py-1 text-xs disabled:opacity-40"
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
    </div>
  );
}
