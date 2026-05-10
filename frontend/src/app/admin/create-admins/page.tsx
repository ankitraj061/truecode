'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Shield, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminAPI, type AdminUserSummary } from '../utils/adminAPI';
import Loader from '@/app/components/TruckLoader';

export default function CreateAdminsPage() {
  const [admins, setAdmins] = useState<AdminUserSummary[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [promoteEmail, setPromoteEmail] = useState('');
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
      setPromoteMessage('Email is required');
      return;
    }

    try {
      setPromoteLoading(true);
      const result = await AdminAPI.promoteToAdmin(promoteEmail.trim());
      setPromoteMessage(result.message);
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
                User email
              </label>
              <input
                type="email"
                value={promoteEmail}
                onChange={(e) => setPromoteEmail(e.target.value)}
                className="input w-full"
                placeholder="user@example.com"
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

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border-primary text-left">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Username</th>
                <th className="py-2 pr-4">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8">
                    <div className="flex flex-col items-center justify-center py-6">
                      <Loader message="Loading admins" submessage="Fetching admin list..." />
                    </div>
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-secondary">
                    No admins found.
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin._id} className="border-t border-border-primary">
                    <td className="py-2 pr-4">
                      <span className="font-medium text-primary">
                        {admin.firstName} {admin.lastName}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-secondary">{admin.emailId}</td>
                    <td className="py-2 pr-4 text-secondary">{admin.username}</td>
                    <td className="py-2 pr-4 text-secondary">
                      {admin.createdAt
                        ? new Date(admin.createdAt).toLocaleDateString()
                        : '-'}
                    </td>
                  </tr>
                ))
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
    </div>
  );
}

