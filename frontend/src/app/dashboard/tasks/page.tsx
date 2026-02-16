'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, api } from '@/lib/api';
import type { Project, Task, TaskWithProject, User } from '@/lib/api';

const columns = ['Todo', 'InProgress', 'Done', 'Blocked'];
const columnLabels: Record<string, string> = { Todo: 'To Do', InProgress: 'In Progress', Done: 'Done', Blocked: 'Blocked' };

export default function TasksPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [myTasks, setMyTasks] = useState<TaskWithProject[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'project' | 'mine'>('project');

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    Promise.all([
      fetch('/api/v1/projects', { headers: { Authorization: `Bearer ${token}` } }).then((res) => (res.ok ? res.json() : [])).then(setProjects),
      api.tasks.myTasks(token).then(setMyTasks).catch(() => setMyTasks([])),
      api.auth.me(token).then(setUser).catch(() => setUser(null)),
    ]).finally(() => setLoading(false));
  }, []);

  const project = projects[0];
  const isTeam = user ? ['developer', 'designer', 'marketer'].includes(user.role) : false;
  const tasksForProject: Task[] = project?.tasks ?? [];
  const tasksToShow = view === 'mine' ? myTasks : tasksForProject;
  const byStatus = (status: string) => tasksToShow.filter((t) => t.status === status);

  if (loading) return <p className="text-gray-500">Loading...</p>;
  // Empty state without toggle only for non-team users; team users must always see "My tasks / By project" toggle
  if (view === 'mine' && myTasks.length === 0 && tasksForProject.length === 0 && !isTeam) {
    return (
      <div className="max-w-5xl">
        <h1 className="text-2xl font-bold text-secondary mb-6">Tasks</h1>
        <p className="text-gray-600 mb-4">No tasks assigned to you.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => (
            <div
              key={col}
              className="rounded-xl border border-gray-200 bg-gray-50/50 p-4"
              data-testid={col === 'InProgress' ? 'kanban-column-inprogress' : `kanban-column-${col.toLowerCase()}`}
            >
              <h2 className="font-semibold text-secondary mb-3">{columnLabels[col] ?? col}</h2>
              <p className="text-sm text-gray-400">None</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary">Tasks</h1>
        {isTeam && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setView('project')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${view === 'project' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              By project
            </button>
            <button
              type="button"
              onClick={() => setView('mine')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${view === 'mine' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              My tasks
            </button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => (
          <div
            key={col}
            className="rounded-xl border border-gray-200 bg-gray-50/50 p-4"
            data-testid={col === 'InProgress' ? 'kanban-column-inprogress' : `kanban-column-${col.toLowerCase()}`}
          >
            <h2 className="font-semibold text-secondary mb-3">
              {columnLabels[col] ?? col}
            </h2>
            <div className="space-y-2">
              {byStatus(col).length === 0 ? (
                <p className="text-sm text-gray-400">None</p>
              ) : (
                byStatus(col).map((t) => (
                  <div
                    key={t.id}
                    className="rounded-lg border border-gray-200 bg-white p-3 text-sm"
                  >
                    <p className="font-medium text-text-dark">{t.title}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      {view === 'mine' ? (t as TaskWithProject).project?.projectName : null}
                      {view === 'mine' && (t as TaskWithProject).project ? ' · ' : ''}
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
