'use client';

import { useEffect, useState, useCallback, type Dispatch, type SetStateAction } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getStoredToken,
  api,
  type WorkspaceOverview,
  type IdeaVaultItem,
  type WorkspaceBusinessModel,
  type WorkspaceTeamMember,
  type WorkspaceFile,
  type WorkspaceInvestorView,
  type WorkspaceProgress,
  type User,
  type MilestoneListResponse,
} from '@/lib/api';
import type { Milestone } from '@/lib/api';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'idea-vault', label: 'Idea Vault' },
  { id: 'business-model', label: 'Business Model' },
  { id: 'roadmap', label: 'Roadmap & Milestones' },
  { id: 'team', label: 'Team' },
  { id: 'documents', label: 'Documents & Files' },
  { id: 'consultation', label: 'Consultation & Support' },
  { id: 'investor-view', label: 'Investor View' },
  { id: 'progress', label: 'Progress' },
] as const;

type TabId = (typeof TABS)[number]['id'];

type OverviewFormState = {
  projectName: string;
  tagline: string;
  problemStatement: string;
  targetMarket: string;
  workspaceStage: string;
};

export default function WorkspaceDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string | undefined;
  const token = getStoredToken();

  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceOverview | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [investorMode, setInvestorMode] = useState(false);
  const [investorViewData, setInvestorViewData] = useState<WorkspaceInvestorView | null>(null);

  const [ideaVaultItems, setIdeaVaultItems] = useState<IdeaVaultItem[]>([]);
  const [businessModel, setBusinessModel] = useState<WorkspaceBusinessModel | null>(null);
  const [teamMembers, setTeamMembers] = useState<WorkspaceTeamMember[]>([]);
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [progress, setProgress] = useState<WorkspaceProgress | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [milestoneSummary, setMilestoneSummary] = useState<MilestoneListResponse['summary'] | null>(null);

  const [editOverview, setEditOverview] = useState(false);
  const [overviewForm, setOverviewForm] = useState<OverviewFormState>({ projectName: '', tagline: '', problemStatement: '', targetMarket: '', workspaceStage: '' });
  const [savingOverview, setSavingOverview] = useState(false);
  const [newVaultTitle, setNewVaultTitle] = useState('');
  const [newVaultContent, setNewVaultContent] = useState('');
  const [newVaultType, setNewVaultType] = useState<'note' | 'pitch_draft'>('note');
  const [creatingVault, setCreatingVault] = useState(false);
  const [businessModelForm, setBusinessModelForm] = useState<Record<string, string>>({});
  const [savingBusinessModel, setSavingBusinessModel] = useState(false);
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'viewer'>('member');
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [addingMember, setAddingMember] = useState(false);

  const loadWorkspace = useCallback(async () => {
    if (!projectId || !token) return null;
    try {
      const data = await api.workspace.get(projectId, token);
      setWorkspace(data);
      setOverviewForm({
        projectName: data.projectName ?? '',
        tagline: data.tagline ?? '',
        problemStatement: data.problemStatement ?? '',
        targetMarket: data.targetMarket ?? '',
        workspaceStage: data.workspaceStage ?? 'Idea',
      });
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load workspace');
      return null;
    }
  }, [projectId, token]);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
    api.auth.me(token).then(setUser).catch(() => {});
  }, [token, router]);

  useEffect(() => {
    if (!projectId || !token) return;
    setLoading(true);
    setError(null);
    loadWorkspace().finally(() => setLoading(false));
  }, [projectId, token, loadWorkspace]);

  useEffect(() => {
    if (!projectId || !token || workspace?.access === 'investor') return;
    switch (activeTab) {
      case 'idea-vault':
        api.workspace.ideaVault.list(projectId, token).then(setIdeaVaultItems).catch(() => setIdeaVaultItems([]));
        break;
      case 'business-model':
        api.workspace.businessModel.get(projectId, token).then((m) => {
          setBusinessModel(m);
          setBusinessModelForm({
            valueProposition: m.valueProposition ?? '',
            customerSegments: m.customerSegments ?? '',
            revenueStreams: m.revenueStreams ?? '',
            costStructure: m.costStructure ?? '',
            channels: m.channels ?? '',
            keyActivities: m.keyActivities ?? '',
          });
        }).catch(() => setBusinessModel(null));
        break;
      case 'team':
        api.workspace.team.list(projectId, token).then(setTeamMembers).catch(() => setTeamMembers([]));
        if (workspace?.access === 'full') {
          api.users.list(token).then((list) => setUsers(Array.isArray(list) ? list : [])).catch(() => setUsers([]));
        }
        break;
      case 'documents':
        api.workspace.files.list(projectId, token).then(setFiles).catch(() => setFiles([]));
        break;
      case 'progress':
        api.workspace.progress(projectId, token).then(setProgress).catch(() => setProgress(null));
        break;
      case 'roadmap':
        api.milestones
          .list(projectId, token)
          .then((result) => {
            setMilestones(result.milestones || []);
            setMilestoneSummary(result.summary || null);
          })
          .catch(() => {
            setMilestones([]);
            setMilestoneSummary(null);
          });
        break;
      case 'investor-view':
        api.workspace.investorView(projectId, token).then(setInvestorViewData).catch(() => setInvestorViewData(null));
        break;
      default:
        break;
    }
  }, [projectId, token, activeTab, workspace?.access]);

  const handleSaveOverview = async () => {
    if (!projectId || !token) return;
    setSavingOverview(true);
    try {
      const updated = await api.workspace.update(projectId, {
        projectName: overviewForm.projectName || undefined,
        tagline: overviewForm.tagline || undefined,
        problemStatement: overviewForm.problemStatement || undefined,
        targetMarket: overviewForm.targetMarket || undefined,
        workspaceStage: (overviewForm.workspaceStage as 'Idea' | 'Validation' | 'Building' | 'Growth') || undefined,
      }, token);
      setWorkspace((w) => (w ? { ...w, ...updated } : null));
      setEditOverview(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSavingOverview(false);
    }
  };

  const handleCreateVaultItem = async () => {
    if (!projectId || !token) return;
    setCreatingVault(true);
    try {
      const item = await api.workspace.ideaVault.create(projectId, {
        type: newVaultType,
        title: newVaultTitle.trim() || 'Untitled',
        content: newVaultContent.trim() || '',
      }, token);
      setIdeaVaultItems((prev) => [item, ...prev]);
      setNewVaultTitle('');
      setNewVaultContent('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create');
    } finally {
      setCreatingVault(false);
    }
  };

  const handleSubmitForReview = async (item: IdeaVaultItem) => {
    if (!projectId || !token) return;
    try {
      const updated = await api.workspace.ideaVault.update(projectId, item.id, { status: 'submitted_for_review' }, token);
      setIdeaVaultItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit');
    }
  };

  const handleSaveBusinessModel = async () => {
    if (!projectId || !token) return;
    setSavingBusinessModel(true);
    try {
      const updated = await api.workspace.businessModel.update(projectId, {
        valueProposition: businessModelForm.valueProposition || null,
        customerSegments: businessModelForm.customerSegments || null,
        revenueStreams: businessModelForm.revenueStreams || null,
        costStructure: businessModelForm.costStructure || null,
        channels: businessModelForm.channels || null,
        keyActivities: businessModelForm.keyActivities || null,
      }, token);
      setBusinessModel(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSavingBusinessModel(false);
    }
  };

  const handleAddTeamMember = async () => {
    if (!projectId || !token || !inviteUserId) return;
    setAddingMember(true);
    try {
      const member = await api.workspace.team.add(projectId, { userId: inviteUserId, role: inviteRole }, token);
      setTeamMembers((prev) => [...prev, { id: member.id, userId: member.userId, role: member.role, name: (member as { user?: { name: string; email: string } }).user?.name ?? '', email: (member as { user?: { email: string } }).user?.email ?? '' }]);
      setInviteUserId('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveTeamMember = async (userId: string) => {
    if (!projectId || !token) return;
    if (!confirm('Remove this member from the workspace?')) return;
    try {
      await api.workspace.team.remove(projectId, userId, token);
      setTeamMembers((prev) => prev.filter((m) => m.userId !== userId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove');
    }
  };

  if (!projectId) {
    return (
      <div className="max-w-4xl">
        <p className="text-gray-500">Invalid project.</p>
      </div>
    );
  }

  if (loading && !workspace) {
    return (
      <div className="max-w-5xl">
        <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-8">
          <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
          <div className="h-4 w-full bg-gray-100 rounded mb-2" />
          <div className="h-4 w-3/4 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (error && !workspace) {
    return (
      <div className="max-w-4xl">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
          <p className="font-medium">{error}</p>
          <Link href="/dashboard/project" className="mt-4 inline-block text-primary font-medium hover:underline">
            ← Back to projects
          </Link>
        </div>
    );
  }

  if (!workspace) return null;

  const canEdit = workspace.access === 'full' || workspace.access === 'team';
  const isInvestorOnly = workspace.access === 'investor';

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <Link href="/dashboard/project" className="text-sm text-primary hover:underline mb-2 inline-block">
            ← Back to projects
          </Link>
          <h1 className="text-2xl font-bold text-secondary">
            {workspace.projectName || 'Startup Workspace'}
          </h1>
          {workspace.tagline && (
            <p className="text-gray-600 mt-1">{workspace.tagline}</p>
          )}
        </div>
        {!isInvestorOnly && (
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={investorMode}
              onChange={(e) => setInvestorMode(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            Investor view mode (read-only pitch)
          </label>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-amber-50 text-amber-800 px-4 py-3 mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-amber-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="border-b border-gray-200 mb-6 overflow-x-auto">
        <nav className="flex gap-0 min-w-max" aria-label="Workspace tabs">
          {TABS.map((tab) => {
            if (isInvestorOnly && !['overview', 'investor-view', 'progress'].includes(tab.id)) return null;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 min-h-[320px]">
        {activeTab === 'overview' && (
          <OverviewTab
            workspace={workspace}
            investorMode={investorMode}
            investorViewData={investorViewData}
            canEdit={canEdit}
            editOverview={editOverview}
            setEditOverview={setEditOverview}
            overviewForm={overviewForm}
            setOverviewForm={setOverviewForm}
            onSave={handleSaveOverview}
            savingOverview={savingOverview}
            loadInvestorView={investorMode && !investorViewData ? () => api.workspace.investorView(projectId!, token!).then(setInvestorViewData) : undefined}
          />
        )}
        {activeTab === 'idea-vault' && (
          <IdeaVaultTab
            items={ideaVaultItems}
            canEdit={canEdit}
            newVaultTitle={newVaultTitle}
            setNewVaultTitle={setNewVaultTitle}
            newVaultContent={newVaultContent}
            setNewVaultContent={setNewVaultContent}
            newVaultType={newVaultType}
            setNewVaultType={setNewVaultType}
            onCreate={handleCreateVaultItem}
            creatingVault={creatingVault}
            onSubmitForReview={handleSubmitForReview}
            projectId={projectId}
            token={token}
          />
        )}
        {activeTab === 'business-model' && (
          <BusinessModelTab
            model={businessModel}
            form={businessModelForm}
            setForm={setBusinessModelForm}
            canEdit={canEdit}
            onSave={handleSaveBusinessModel}
            saving={savingBusinessModel}
          />
        )}
        {activeTab === 'roadmap' && (
          <RoadmapTab
            milestones={milestones}
            summary={milestoneSummary}
            projectId={projectId}
            token={token}
            canEdit={canEdit}
            user={user}
            onRefresh={async () => {
              if (!token || !projectId) return;
              const result = await api.milestones.list(projectId, token);
              setMilestones(result.milestones || []);
              setMilestoneSummary(result.summary || null);
            }}
          />
        )}
        {activeTab === 'team' && (
          <TeamTab
            members={teamMembers}
            users={users}
            canEdit={workspace.access === 'full'}
            inviteUserId={inviteUserId}
            setInviteUserId={setInviteUserId}
            inviteRole={inviteRole}
            setInviteRole={setInviteRole}
            onAdd={handleAddTeamMember}
            onRemove={handleRemoveTeamMember}
            addingMember={addingMember}
          />
        )}
        {activeTab === 'documents' && (
          <DocumentsTab files={files} />
        )}
        {activeTab === 'consultation' && (
          <ConsultationTab user={user} projectId={projectId} />
        )}
        {activeTab === 'investor-view' && (
          <InvestorViewTab data={investorViewData} />
        )}
        {activeTab === 'progress' && (
          <ProgressTab progress={progress} />
        )}
      </div>
    </div>
  );
}

function OverviewTab({
  workspace,
  investorMode,
  investorViewData,
  canEdit,
  editOverview,
  setEditOverview,
  overviewForm,
  setOverviewForm,
  onSave,
  savingOverview,
  loadInvestorView,
}: {
  workspace: WorkspaceOverview;
  investorMode: boolean;
  investorViewData: WorkspaceInvestorView | null;
  canEdit: boolean;
  editOverview: boolean;
  setEditOverview: (v: boolean) => void;
  overviewForm: OverviewFormState;
  setOverviewForm: Dispatch<SetStateAction<OverviewFormState>>;
  onSave: () => void;
  savingOverview: boolean;
  loadInvestorView?: () => void;
}) {
  useEffect(() => {
    if (loadInvestorView) loadInvestorView();
  }, [loadInvestorView]);

  const data = investorMode && investorViewData ? investorViewData : workspace;
  const displayName = 'projectName' in data ? data.projectName : (data as WorkspaceOverview).projectName;
  const displayTagline = 'tagline' in data ? data.tagline : (data as WorkspaceOverview).tagline;
  const displayProblem = 'problemStatement' in data ? data.problemStatement : (data as WorkspaceOverview).problemStatement;
  const displayTarget = 'targetMarket' in data ? data.targetMarket : (data as WorkspaceOverview).targetMarket;
  const displayStage = 'workspaceStage' in data ? data.workspaceStage : (data as WorkspaceOverview).workspaceStage;
  const founderName = investorViewData && investorMode ? investorViewData.founderName : (workspace.founder?.name ?? null);

  if (investorMode && investorViewData) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Read-only pitch profile</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500 mb-1">Startup name</p>
            <p className="font-semibold text-secondary">{displayName || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Tagline</p>
            <p className="text-gray-700">{displayTagline || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Stage</p>
            <p className="capitalize text-primary">{displayStage || 'Idea'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Founder</p>
            <p className="text-gray-700">{founderName || '—'}</p>
          </div>
        </div>
        {displayProblem && (
          <div>
            <p className="text-sm text-gray-500 mb-1">Problem</p>
            <p className="text-gray-700 whitespace-pre-wrap">{displayProblem}</p>
          </div>
        )}
        {displayTarget && (
          <div>
            <p className="text-sm text-gray-500 mb-1">Target market</p>
            <p className="text-gray-700 whitespace-pre-wrap">{displayTarget}</p>
          </div>
        )}
      </div>
    );
  }

  if (editOverview) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project name</label>
          <input
            type="text"
            value={overviewForm.projectName}
            onChange={(e) => setOverviewForm((f) => ({ ...f, projectName: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
          <input
            type="text"
            value={overviewForm.tagline}
            onChange={(e) => setOverviewForm((f) => ({ ...f, tagline: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Problem statement</label>
          <textarea
            value={overviewForm.problemStatement}
            onChange={(e) => setOverviewForm((f) => ({ ...f, problemStatement: e.target.value }))}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target market</label>
          <textarea
            value={overviewForm.targetMarket}
            onChange={(e) => setOverviewForm((f) => ({ ...f, targetMarket: e.target.value }))}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
          <select
            value={overviewForm.workspaceStage}
            onChange={(e) => setOverviewForm((f) => ({ ...f, workspaceStage: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          >
            {['Idea', 'Validation', 'Building', 'Growth'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={savingOverview}
            className="rounded-lg bg-primary px-4 py-2 text-white font-medium hover:opacity-90 disabled:opacity-50"
          >
            {savingOverview ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => setEditOverview(false)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-gray-500 mb-1">Startup name</p>
          <p className="font-semibold text-secondary">{displayName || '—'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">Tagline</p>
          <p className="text-gray-700">{displayTagline || '—'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">Stage</p>
          <p className="capitalize text-primary">{displayStage || 'Idea'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">Founder</p>
          <p className="text-gray-700">
            {workspace.founder ? `${workspace.founder.name} (${workspace.founder.email})` : '—'}
          </p>
        </div>
      </div>
      {displayProblem && (
        <div>
          <p className="text-sm text-gray-500 mb-1">Problem being solved</p>
          <p className="text-gray-700 whitespace-pre-wrap">{displayProblem}</p>
        </div>
      )}
      {displayTarget && (
        <div>
          <p className="text-sm text-gray-500 mb-1">Target market</p>
          <p className="text-gray-700 whitespace-pre-wrap">{displayTarget}</p>
        </div>
      )}
      {canEdit && (
        <button
          type="button"
          onClick={() => setEditOverview(true)}
          className="rounded-lg border border-primary px-4 py-2 text-primary font-medium hover:bg-primary/5"
        >
          Edit overview
        </button>
      )}
    </div>
  );
}

function IdeaVaultTab({
  items,
  canEdit,
  newVaultTitle,
  setNewVaultTitle,
  newVaultContent,
  setNewVaultContent,
  newVaultType,
  setNewVaultType,
  onCreate,
  creatingVault,
  onSubmitForReview,
  projectId,
  token,
}: {
  items: IdeaVaultItem[];
  canEdit: boolean;
  newVaultTitle: string;
  setNewVaultTitle: (v: string) => void;
  newVaultContent: string;
  setNewVaultContent: (v: string) => void;
  newVaultType: 'note' | 'pitch_draft';
  setNewVaultType: (v: 'note' | 'pitch_draft') => void;
  onCreate: () => void;
  creatingVault: boolean;
  onSubmitForReview: (item: IdeaVaultItem) => void;
  projectId: string;
  token: string | null;
}) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">Private structured storage for business ideas, notes, and pitch drafts.</p>
      {canEdit && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">Add new</p>
          <select
            value={newVaultType}
            onChange={(e) => setNewVaultType(e.target.value as 'note' | 'pitch_draft')}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="note">Note</option>
            <option value="pitch_draft">Pitch draft</option>
          </select>
          <input
            type="text"
            placeholder="Title"
            value={newVaultTitle}
            onChange={(e) => setNewVaultTitle(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Content"
            value={newVaultContent}
            onChange={(e) => setNewVaultContent(e.target.value)}
            rows={3}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCreate}
              disabled={creatingVault}
              className="rounded-lg bg-primary px-4 py-2 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {creatingVault ? 'Creating...' : 'Save draft'}
            </button>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-gray-500 text-sm">No items yet.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-medium text-secondary">{item.title}</span>
                <span className="text-xs text-gray-500 capitalize">{item.type.replace('_', ' ')} · {item.status.replace('_', ' ')}</span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">{item.content || '—'}</p>
              {canEdit && item.status === 'draft' && (
                <button
                  type="button"
                  onClick={() => onSubmitForReview(item)}
                  className="mt-2 text-sm text-primary font-medium hover:underline"
                >
                  Submit for review
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function BusinessModelTab({
  model,
  form,
  setForm,
  canEdit,
  onSave,
  saving,
}: {
  model: WorkspaceBusinessModel | null;
  form: Record<string, string>;
  setForm: (v: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  canEdit: boolean;
  onSave: () => void;
  saving: boolean;
}) {
  const sections = [
    { key: 'valueProposition', label: 'Value Proposition' },
    { key: 'customerSegments', label: 'Customer Segments' },
    { key: 'revenueStreams', label: 'Revenue Streams' },
    { key: 'costStructure', label: 'Cost Structure' },
    { key: 'channels', label: 'Channels' },
    { key: 'keyActivities', label: 'Key Activities' },
  ];
  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">Business model canvas — define how you create, deliver, and capture value.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map(({ key, label }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            {canEdit ? (
              <textarea
                value={form[key] ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 text-sm"
              />
            ) : (
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{model?.[key as keyof WorkspaceBusinessModel] ?? '—'}</p>
            )}
          </div>
        ))}
      </div>
      {canEdit && (
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-2 text-white font-medium hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save business model'}
        </button>
      )}
    </div>
  );
}

function RoadmapTab({
  milestones,
  summary,
  projectId,
  token,
  canEdit,
  user,
  onRefresh,
}: {
  milestones: Milestone[];
  summary: MilestoneListResponse['summary'] | null;
  projectId: string;
  token: string | null;
  canEdit: boolean;
  user: User | null;
  onRefresh: () => Promise<void>;
}) {
  const [paymentMethod, setPaymentMethod] = useState<'auto' | 'stripe' | 'paystack' | 'bank_transfer'>('auto');
  const [payingMilestoneId, setPayingMilestoneId] = useState<string | null>(null);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [bankTransferPaymentId, setBankTransferPaymentId] = useState<string | null>(null);
  const [bankTransferRef, setBankTransferRef] = useState('');
  const [bankTransferProofFile, setBankTransferProofFile] = useState<File | null>(null);
  const [bankTransferAccounts, setBankTransferAccounts] = useState<Array<{ label: string; bankName: string; accountName: string; accountNumber: string; currency: string; routingNumber?: string; accountType?: string; bankAddress?: string }>>([]);
  const [creatingMilestone, setCreatingMilestone] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    amount: '',
    currency: 'USD',
    dueDate: '',
  });

  const isClient = user?.role === 'client';
  const canManageMilestones = canEdit && user?.role !== 'client';

  async function handleCreateMilestone() {
    if (!token) return;
    const amount = Number(newMilestone.amount);
    if (!newMilestone.title.trim() || !Number.isFinite(amount) || amount <= 0) {
      setPaymentMessage('Enter a valid milestone title and amount.');
      return;
    }
    setCreatingMilestone(true);
    setPaymentMessage(null);
    try {
      await api.milestones.create(
        projectId,
        {
          title: newMilestone.title.trim(),
          description: newMilestone.description.trim() || undefined,
          amount,
          currency: newMilestone.currency.trim().toUpperCase(),
          dueDate: newMilestone.dueDate || undefined,
        },
        token
      );
      setNewMilestone({ title: '', description: '', amount: '', currency: newMilestone.currency, dueDate: '' });
      await onRefresh();
      setPaymentMessage('Milestone created successfully.');
    } catch (e) {
      setPaymentMessage(e instanceof Error ? e.message : 'Could not create milestone.');
    } finally {
      setCreatingMilestone(false);
    }
  }

  async function handlePayMilestone(milestoneId: string) {
    if (!token) return;
    setPayingMilestoneId(milestoneId);
    setPaymentMessage(null);
    try {
      const session = await api.milestones.createPaymentSession(milestoneId, { paymentMethod }, token);
      if (session.paymentMethod === 'bank_transfer') {
        setBankTransferPaymentId(session.paymentId);
        setBankTransferAccounts(session.bankAccounts || []);
        setPaymentMessage(session.message || 'Bank transfer created. Upload proof and transfer reference.');
      } else if (session.checkoutUrl) {
        window.location.href = session.checkoutUrl;
      } else {
        setPaymentMessage('Payment session created but checkout URL is missing.');
      }
      await onRefresh();
    } catch (e) {
      setPaymentMessage(e instanceof Error ? e.message : 'Could not start payment.');
    } finally {
      setPayingMilestoneId(null);
    }
  }

  async function handleSubmitBankTransferProof() {
    if (!token || !bankTransferPaymentId || !bankTransferProofFile || !bankTransferRef.trim()) {
      setPaymentMessage('Upload proof and enter transfer reference.');
      return;
    }

    setPaymentMessage(null);
    try {
      const proofOfPaymentUrl = await api.manualPayments.uploadReceipt(bankTransferProofFile, token);
      await api.milestones.submitBankTransferProof(
        bankTransferPaymentId,
        {
          proofOfPaymentUrl,
          transferReference: bankTransferRef.trim(),
        },
        token
      );
      setBankTransferProofFile(null);
      setBankTransferRef('');
      setBankTransferPaymentId(null);
      setBankTransferAccounts([]);
      setPaymentMessage('Transfer proof submitted. Awaiting Super Admin confirmation.');
      await onRefresh();
    } catch (e) {
      setPaymentMessage(e instanceof Error ? e.message : 'Could not submit transfer proof.');
    }
  }

  const phases = [
    'Phase 1: Validation',
    'Phase 2: Prototype',
    'Phase 3: Launch',
    'Phase 4: Growth',
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">Project Progress & Milestones. Milestones are admin-controlled and payment amounts are locked.</p>

      {summary && (
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-xs text-gray-500">Completed</p>
            <p className="text-lg font-semibold text-emerald-700">{summary.completed.length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-xs text-gray-500">Pending</p>
            <p className="text-lg font-semibold text-amber-700">{summary.pending.length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-xs text-gray-500">Upcoming</p>
            <p className="text-lg font-semibold text-blue-700">{summary.upcoming.length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-xs text-gray-500">Paid / Total</p>
            <p className="text-lg font-semibold text-secondary">
              {summary.paidAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} / {summary.totalAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 p-4 mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Roadmap phases</p>
        <ul className="text-sm text-gray-600 space-y-1">
          {phases.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>

      {canManageMilestones && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
          <p className="text-sm font-medium text-gray-800">Create Milestone (Admin)</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={newMilestone.title}
              onChange={(e) => setNewMilestone((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Milestone title"
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={newMilestone.amount}
              onChange={(e) => setNewMilestone((prev) => ({ ...prev, amount: e.target.value }))}
              placeholder="Amount"
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              type="text"
              value={newMilestone.currency}
              onChange={(e) => setNewMilestone((prev) => ({ ...prev, currency: e.target.value.toUpperCase() }))}
              placeholder="Currency (USD/NGN)"
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={newMilestone.dueDate}
              onChange={(e) => setNewMilestone((prev) => ({ ...prev, dueDate: e.target.value }))}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <textarea
            value={newMilestone.description}
            onChange={(e) => setNewMilestone((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Description"
            rows={2}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleCreateMilestone}
            disabled={creatingMilestone}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {creatingMilestone ? 'Saving…' : 'Save Milestone'}
          </button>
        </div>
      )}

      {isClient && (
        <div className="rounded-lg border border-gray-200 p-4 space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Payment Method</p>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as 'auto' | 'stripe' | 'paystack' | 'bank_transfer')}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="auto">Auto (best available)</option>
              <option value="stripe">Card (Stripe)</option>
              <option value="paystack">Paystack</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>

          {bankTransferPaymentId && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2 text-sm">
              <p className="font-medium text-amber-800">Bank transfer pending confirmation</p>
              {bankTransferAccounts.map((account, index) => (
                <div key={`${account.accountNumber}-${index}`} className="rounded border border-amber-200 bg-white p-2 text-xs text-gray-700">
                  <p><span className="font-medium">{account.label}</span> ({account.currency})</p>
                  <p>{account.bankName}</p>
                  <p>{account.accountName} — {account.accountNumber}</p>
                  {account.routingNumber ? <p>Routing: {account.routingNumber}</p> : null}
                </div>
              ))}
              <input
                type="text"
                value={bankTransferRef}
                onChange={(e) => setBankTransferRef(e.target.value)}
                placeholder="Transfer reference"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setBankTransferProofFile(e.target.files?.[0] || null)}
                className="w-full text-sm"
              />
              <button
                type="button"
                onClick={handleSubmitBankTransferProof}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Submit Transfer Proof
              </button>
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 p-4">
        <p className="font-medium text-secondary mb-2">Milestones</p>
        {milestones.length === 0 ? (
          <p className="text-sm text-gray-500">No milestones yet.</p>
        ) : (
          <ul className="space-y-3">
            {milestones.map((m) => (
              <li key={m.id} className="rounded-lg border border-gray-200 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`capitalize px-2 py-0.5 rounded text-xs ${m.status === 'paid' || m.status === 'Completed' ? 'bg-green-100 text-green-800' : m.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
                    {m.status}
                  </span>
                  {m.isActive ? <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">Active</span> : null}
                  <span className="font-medium text-gray-900">{m.title}</span>
                  <span className="ml-auto font-semibold text-secondary">
                    {m.currency} {Number(m.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {m.description ? <p className="mt-2 text-gray-600">{m.description}</p> : null}
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>{m.dueDate ? `Due: ${new Date(m.dueDate).toLocaleDateString()}` : 'No due date'}</span>
                  {m.latestPayment ? <span>Last payment: {m.latestPayment.status}</span> : null}
                </div>

                {isClient && m.isActive && m.status !== 'paid' && m.status !== 'Completed' ? (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => handlePayMilestone(m.id)}
                      disabled={payingMilestoneId === m.id}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
                    >
                      {payingMilestoneId === m.id ? 'Processing…' : 'Pay Now'}
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {paymentMessage ? (
        <div className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">{paymentMessage}</div>
      ) : null}

      <div className="pt-2">
        <Link
          href={`/dashboard/tasks${projectId ? `?projectId=${projectId}` : ''}`}
          className="text-primary font-medium hover:underline"
        >
          Open tasks & milestones →
        </Link>
      </div>
    </div>
  );
}

function TeamTab({
  members,
  users,
  canEdit,
  inviteUserId,
  setInviteUserId,
  inviteRole,
  setInviteRole,
  onAdd,
  onRemove,
  addingMember,
}: {
  members: WorkspaceTeamMember[];
  users: { id: string; name: string; email: string }[];
  canEdit: boolean;
  inviteUserId: string;
  setInviteUserId: (v: string) => void;
  inviteRole: 'member' | 'viewer';
  setInviteRole: (v: 'member' | 'viewer') => void;
  onAdd: () => void;
  onRemove: (userId: string) => void;
  addingMember: boolean;
}) {
  const existingIds = new Set(members.map((m) => m.userId));
  const availableUsers = users.filter((u) => !existingIds.has(u.id));
  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">Assigned team members and roles. Founder and admins can invite.</p>
      {canEdit && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[200px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">User</label>
            <select
              value={inviteUserId}
              onChange={(e) => setInviteUserId(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Select user</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'member' | 'viewer')}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <button
            type="button"
            onClick={onAdd}
            disabled={!inviteUserId || addingMember}
            className="rounded-lg bg-primary px-4 py-2 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {addingMember ? 'Adding...' : 'Invite'}
          </button>
        </div>
      )}
      <ul className="space-y-2">
        {members.length === 0 ? (
          <p className="text-gray-500 text-sm">No team members yet.</p>
        ) : (
          members.map((m) => (
            <li key={m.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
              <div>
                <p className="font-medium text-secondary">{m.name}</p>
                <p className="text-sm text-gray-500">{m.email} · {m.role}</p>
              </div>
              {canEdit && m.role !== 'founder' && (
                <button
                  type="button"
                  onClick={() => onRemove(m.userId)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function DocumentsTab({ files }: { files: WorkspaceFile[] }) {
  const byCategory = files.reduce((acc, f) => {
    const cat = f.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(f);
    return acc;
  }, {} as Record<string, WorkspaceFile[]>);
  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">Secure file storage: pitch deck, financial plans, legal docs.</p>
      {files.length === 0 ? (
        <p className="text-gray-500 text-sm">No files yet.</p>
      ) : (
        Object.entries(byCategory).map(([category, list]) => (
          <div key={category}>
            <p className="text-sm font-medium text-gray-700 mb-2 capitalize">{category.replace('_', ' ')}</p>
            <ul className="space-y-2">
              {list.map((f) => (
                <li key={f.id} className="flex items-center justify-between rounded border border-gray-200 px-3 py-2">
                  <span className="text-sm font-medium truncate">{f.fileName || (f.fileUrl && f.fileUrl.split('/').pop()) || 'File'}</span>
                  <a href={f.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline">
                    Open
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
      <p className="text-sm text-gray-500">Upload files from the main Files area linked to this project.</p>
    </div>
  );
}

function ConsultationTab({ user, projectId }: { user: User | null; projectId: string }) {
  const setupPaid = user?.setupPaid ?? false;
  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">Book consultations with the platform team.</p>
      {setupPaid ? (
        <div>
          <Link
            href="/dashboard/consultation"
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-white font-medium hover:opacity-90"
          >
            Free booking
          </Link>
          <p className="mt-2 text-sm text-gray-500">Setup fee paid — you can book free consultations.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <p className="font-medium">Setup fee required</p>
          <p className="text-sm mt-1">Complete setup payment to unlock free consultation booking.</p>
          <Link href="/setup-payment" className="mt-3 inline-block text-amber-700 font-medium hover:underline">
            Go to setup payment →
          </Link>
        </div>
      )}
    </div>
  );
}

function InvestorViewTab({ data }: { data: WorkspaceInvestorView | null }) {
  if (!data) return <p className="text-gray-500 text-sm">Loading...</p>;
  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Read-only pitch profile (no internal notes)</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-gray-500 mb-1">Startup</p>
          <p className="font-semibold text-secondary">{data.projectName}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">Tagline</p>
          <p className="text-gray-700">{data.tagline || '—'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">Stage</p>
          <p className="capitalize text-primary">{data.workspaceStage || 'Idea'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">Founder</p>
          <p className="text-gray-700">{data.founderName || '—'}</p>
        </div>
      </div>
      {data.problemStatement && (
        <div>
          <p className="text-sm text-gray-500 mb-1">Problem</p>
          <p className="text-gray-700 whitespace-pre-wrap">{data.problemStatement}</p>
        </div>
      )}
      {data.targetMarket && (
        <div>
          <p className="text-sm text-gray-500 mb-1">Target market</p>
          <p className="text-gray-700 whitespace-pre-wrap">{data.targetMarket}</p>
        </div>
      )}
      {data.description && (
        <div>
          <p className="text-sm text-gray-500 mb-1">Description</p>
          <p className="text-gray-700 whitespace-pre-wrap">{data.description}</p>
        </div>
      )}
    </div>
  );
}

function ProgressTab({ progress }: { progress: WorkspaceProgress | null }) {
  if (!progress) return <p className="text-gray-500 text-sm">Loading...</p>;
  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">Tasks completed, reviews done, stage progression.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Tasks completed</p>
          <p className="text-2xl font-bold text-secondary">{progress.tasksCompleted} / {progress.tasksTotal}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Milestones completed</p>
          <p className="text-2xl font-bold text-secondary">{progress.milestonesCompleted} / {progress.milestonesTotal}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Stage</p>
          <p className="text-xl font-semibold text-primary capitalize">{progress.workspaceStage || 'Idea'}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Overall progress</p>
          <p className="text-2xl font-bold text-secondary">{progress.progressPercent}%</p>
        </div>
      </div>
    </div>
  );
}
