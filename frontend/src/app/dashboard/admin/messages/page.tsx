'use client';

import { useEffect, useState } from 'react';
import { api, getStoredToken, getStoredRoleFromToken, type AdminMessageRow, type User } from '@/lib/api';

export default function AdminMessagesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<AdminMessageRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('unread');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenRole, setTokenRole] = useState<string | null>(null);

  useEffect(() => {
    setTokenRole(getStoredRoleFromToken());
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api.auth
      .me(token)
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    api.superAdmin.messages
      .list(token, {
        status: statusFilter || undefined,
        limit: 100,
      })
      .then((res) => {
        setMessages(res.items);
      })
      .catch(() => setError('Unable to load messages right now.'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const isSuperAdmin = (user?.role || tokenRole) === 'super_admin';

  const handleStatusChange = async (id: string, status: string) => {
    const token = getStoredToken();
    if (!token) return;
    try {
      const updated = await api.superAdmin.messages.updateStatus(id, status, token);
      setMessages((rows) => rows.map((m) => (m.id === updated.id ? updated : m)));
    } catch {
      // best-effort
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-secondary mb-4">Messages</h1>
        <p className="text-gray-600">Only Super Admins can view the platform inbox.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary mb-2">Platform messages</h1>
        <p className="text-gray-600 text-sm">
          All contact messages sent through the public site and dashboards. Use email for replies; this inbox keeps the
          system of record.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Messages are automatically forwarded to founder email addresses.</span>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700"
        >
          <option value="unread">Unread</option>
          <option value="">All</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
        </select>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading messages…</div>
        ) : error ? (
          <div className="p-6 text-sm text-red-600">{error}</div>
        ) : messages.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No messages found for this filter.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {messages.map((m) => (
              <article key={m.id} className="px-4 py-3 flex flex-col gap-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-secondary">
                      {m.subject || 'No subject'}{' '}
                      <span className="ml-1 text-xs font-normal text-gray-500">
                        · {new Date(m.createdAt).toLocaleString()}
                      </span>
                    </p>
                    <p className="text-xs text-gray-600">
                      From {m.name} &lt;{m.email}&gt;{' '}
                      {m.phone ? (
                        <span className="ml-1">
                          · <span className="font-mono">{m.phone}</span>
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        m.status === 'unread'
                          ? 'bg-blue-50 text-blue-700'
                          : m.status === 'replied'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {m.status.toUpperCase()}
                    </span>
                    <div className="flex gap-1">
                      {m.status !== 'read' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(m.id, 'read')}
                          className="rounded-full border border-gray-300 px-2 py-0.5 text-[10px] text-gray-700 hover:border-primary hover:text-primary"
                        >
                          Mark read
                        </button>
                      )}
                      {m.status !== 'replied' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(m.id, 'replied')}
                          className="rounded-full border border-gray-300 px-2 py-0.5 text-[10px] text-gray-700 hover:border-emerald-500 hover:text-emerald-700"
                        >
                          Mark replied
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-800 whitespace-pre-line">{m.message}</p>
                {m.attachmentUrl && (
                  <a
                    href={m.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex text-xs text-primary hover:underline"
                  >
                    Download attachment
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

