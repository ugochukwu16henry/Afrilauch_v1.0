// Use NEXT_PUBLIC_API_URL when set (e.g. Railway). Browser calls backend directly; CORS must allow your frontend origin (set FRONTEND_URL on the backend).
// When empty, relative URLs are used (Next.js rewrite proxies to backend; requires rewrite to be configured at build time).
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export type UserRole =
  | 'client'
  | 'developer'
  | 'designer'
  | 'marketer'
  | 'project_manager'
  | 'finance_admin'
  | 'super_admin'
  | 'investor'
  | 'talent'
  | 'hirer'
  | 'hiring_company'
  | 'hr_manager'
  | 'legal_team'
  | 'cofounder';

export interface PricingConfig {
  ideaStarterSetupFeeUsd: number;
  investorSetupFeeUsd: number;
}

export interface TenantBranding {
  id: string;
  orgName: string;
  domain: string | null;
  logo: string | null;
  primaryColor: string | null;
  planType: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId?: string | null;
  setupPaid?: boolean;
  setupReason?: string | null;
  avatarUrl?: string | null;
  lastLoginAt?: string | null;
  welcomePanelSeen?: boolean;
  createdAt?: string;
  customRole?: { id: string; name: string; department: string | null; level: string | null } | null;
  tenant?: {
    id: string;
    orgName: string;
    domain: string | null;
    logo: string | null;
    primaryColor: string | null;
    planType: string;
  } | null;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('riseflow_token');
}

export function setStoredToken(token: string) {
  if (typeof window !== 'undefined') localStorage.setItem('riseflow_token', token);
}

export function clearStoredToken() {
  meCache = null;
  if (typeof window !== 'undefined') localStorage.removeItem('riseflow_token');
}

let meCache: { token: string; user: User; at: number } | null = null;
const ME_CACHE_MS = 8000;

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...init } = options;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: 'include' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string; error?: string };
    throw new Error(err.message || err.error || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  try {
    return await res.json();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid response';
    throw new Error(`Server returned invalid JSON: ${msg}`);
  }
}

export interface IdeaSubmissionBody {
  name: string;
  email: string;
  password: string;
  country: string;
  ideaDescription: string;
  problemItSolves: string;
  targetUsers: string;
  industry: string;
  stage: 'just_idea' | 'prototype' | 'existing_business';
  goals: string[];
  budgetRange: string;
}

export interface IdeaSubmissionResponse extends AuthResponse {
  message: string;
}

export interface ConsultationBookingBody {
  fullName: string;
  email: string;
  country?: string;
  businessIdea?: string;
  stage?: string;
  mainGoal?: string;
  budgetRange?: string;
  preferredContactMethod?: string;
  preferredDate?: string;
  preferredTime?: string;
  timezone?: string;
}

export interface ConsultationBookingResponse {
  id: string;
  message: string;
}

export interface ContactMessageBody {
  name: string;
  email: string;
  subject?: string;
  message: string;
  phone?: string;
  attachmentUrl?: string;
}

export interface ContactMessageResponse {
  id: string;
  message: string;
}

export interface EarlyAccessStatusSummary {
  limit: number;
  total: number;
  remaining: number;
  enabled: boolean;
}

export interface EarlyAccessMeResponse {
  enrolled: boolean;
  status?: 'active' | 'inactive' | 'completed' | 'revoked';
  signupOrder?: number;
  ideaSubmitted?: boolean;
  consultationCompleted?: boolean;
}

export type DashboardFeatureKey =
  | 'idea_workspace'
  | 'ai_guidance'
  | 'consultations'
  | 'marketplace'
  | 'donor_badge'
  | 'early_founder'
  | 'admin_dashboard';

export interface UserFeatureState {
  userId: string;
  role: UserRole;
  hasSetupAccess: boolean;
  hasMarketplaceAccess: boolean;
  isEarlyFounder: boolean;
  hasDonorBadge: boolean;
  hasPendingManualPayment: boolean;
  pendingManualPayment?: {
    id: string;
    amount: number;
    currency: string;
    paymentType: 'platform_fee' | 'donation';
    submittedAt: string;
  };
  earlyAccess?:
    | {
        status: 'active' | 'inactive' | 'completed' | 'revoked';
        signupOrder: number;
        ideaSubmitted: boolean;
        consultationCompleted: boolean;
      }
    | null;
  badges: UserBadge[];
  unlockedFeatures: DashboardFeatureKey[];
}

export interface ManualPayment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  paymentType: 'platform_fee' | 'donation';
  status: 'Pending' | 'Confirmed' | 'Rejected';
  submittedAt: string;
  confirmedAt: string | null;
  notes: string | null;
  userName?: string;
  userEmail?: string;
  proofUrl?: string | null;
}

export interface TalentApplyBody {
  name?: string;
  email?: string;
  password?: string;
  skills: string[];
  customRole?: string;
  roleCategory?: string;
  yearsExperience: number;
  portfolioUrl?: string;
  resumeUrl?: string;
  cvUrl?: string;
  pastProjects?: Array<{ title: string; description?: string; url?: string }>;
  shortBio?: string;
  availability?: 'full_time' | 'part_time' | 'freelance';
  country?: string;
  phone?: string;
  services?: Array<{ title: string; description?: string; rate?: string }>;
  skillRates?: Record<string, string>;
  videoUrl?: string;
}

export interface TalentApplyResponse {
  talent: { id: string; status: string; skills: string[]; yearsExperience: number; portfolioUrl?: string | null; user: { id: string; name: string; email: string; role: string } };
  token?: string;
}

export interface TalentMarketplaceItem {
  id: string;
  name: string;
  skills: string[];
  customRole: string | null;
  yearsExperience: number;
  portfolioUrl: string | null;
  pastProjects: unknown;
  averageRating: number | null;
  ratingCount: number;
}

export interface TalentProfile {
  id: string;
  status: string;
  skills: string[];
  customRole: string | null;
  yearsExperience: number;
  portfolioUrl: string | null;
  resumeUrl: string | null;
  pastProjects: unknown;
  feePaid: boolean;
  averageRating: number | null;
  ratingCount: number;
  user: { id: string; name: string; email: string; role: string };
  createdAt: string;
  approvedAt: string | null;
}

export interface TalentListItem {
  id: string;
  status: string;
  skills: string[];
  customRole: string | null;
  yearsExperience: number;
  portfolioUrl: string | null;
  feePaid: boolean;
  averageRating: number | null;
  ratingCount: number;
  createdAt: string;
  approvedAt: string | null;
  user: { id: string; name: string; email: string; createdAt: string };
}

export interface HirerRegisterBody {
  name?: string;
  email?: string;
  password?: string;
  companyName: string;
  hiringNeeds?: string;
  budget?: string;
}

export interface HirerRegisterResponse {
  hirer: { id: string; companyName: string; hiringNeeds?: string | null; budget?: string | null; feePaid: boolean; fairTreatmentSignedAt?: string | null; user: { id: string; name: string; email: string; role: string } };
  token?: string;
}

export interface HirerProfile {
  id: string;
  companyName: string;
  hiringNeeds: string | null;
  budget: string | null;
  feePaid: boolean;
  fairTreatmentSignedAt: string | null;
  user: { id: string; name: string; email: string; role: string };
  createdAt: string;
}

export interface HirerListItem {
  id: string;
  companyName: string;
  hiringNeeds: string | null;
  budget: string | null;
  feePaid: boolean;
  fairTreatmentSignedAt: string | null;
  user: { id: string; name: string; email: string; createdAt: string };
  createdAt: string;
}

export interface HireResponse {
  id: string;
  talentId: string;
  hirerId: string;
  projectTitle: string;
  projectDescription?: string | null;
  status: string;
  talent: { name: string; email: string };
  hirer: { name: string; email: string };
  createdAt: string;
}

export interface HireListItem {
  id: string;
  talentId: string;
  hirerId: string;
  projectTitle: string;
  projectDescription?: string | null;
  agreementId?: string | null;
  status: string;
  talent: { id: string; name: string; email: string };
  hirer: { id: string; name: string; email: string };
  agreement?: { id: string; title: string; type: string } | null;
  createdAt: string;
  completedAt?: string | null;
}

export interface RatingItem {
  id: string;
  fromUser?: { id: string; name: string };
  toUserId: string;
  hireId: string | null;
  score: number;
  comment: string | null;
  createdAt: string;
}

export interface LegalAgreementsResponse {
  assignments: unknown[];
  hireContracts: unknown[];
}

export const api = {
  ideaSubmissions: {
    submit: (body: IdeaSubmissionBody) =>
      request<IdeaSubmissionResponse>('/api/v1/idea-submissions', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
  consultations: {
    book: (body: ConsultationBookingBody) =>
      request<ConsultationBookingResponse>('/api/v1/consultations', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
  contact: {
    send: (body: ContactMessageBody) =>
      request<ContactMessageResponse>('/api/v1/contact', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
  supportBanner: {
    logEvent: (eventType: 'shown' | 'clicked_support' | 'closed' | 'dont_show_again', metadata?: Record<string, unknown>) =>
      request<{ ok: boolean }>('/api/v1/support-banner/events', {
        method: 'POST',
        body: JSON.stringify({ eventType, metadata }),
      }),
  },
  manualPayments: {
    create: (
      body: { amount: number; currency: 'NGN' | 'USD'; paymentType: 'platform_fee' | 'donation'; notes?: string; proofUrl?: string },
      token: string
    ) =>
      request<ManualPayment>('/api/v1/manual-payments', {
        method: 'POST',
        body: JSON.stringify(body),
        token,
      }),
    /** Upload receipt file (image or PDF); returns URL to use as proofUrl. Requires Cloudinary configured on backend. */
    uploadReceipt: async (file: File, token: string): Promise<string> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'receipt');
      const res = await fetch(`${API_BASE}/api/v1/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || res.statusText);
      }
      const data = (await res.json()) as { url?: string; secureUrl?: string };
      return data.secureUrl ?? data.url ?? '';
    },
  },
  earlyAccess: {
    status: () => request<EarlyAccessStatusSummary>('/api/v1/early-access/status'),
    me: (token: string) => request<EarlyAccessMeResponse>('/api/v1/early-access/me', { token }),
  },
  auth: {
    register: (body: { name: string; email: string; password: string; role?: UserRole }, tenantDomain?: string) =>
      request<AuthResponse>('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
        ...(tenantDomain && { headers: { 'X-Tenant-Domain': tenantDomain } as HeadersInit }),
      }),
    login: (body: { email: string; password: string }, tenantDomain?: string) =>
      request<AuthResponse>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
        ...(tenantDomain && { headers: { 'X-Tenant-Domain': tenantDomain } as HeadersInit }),
      }),
    me: (token: string) => {
      if (meCache && meCache.token === token && Date.now() - meCache.at < ME_CACHE_MS) return Promise.resolve(meCache.user);
      return request<User>('/api/v1/auth/me', { token }).then((user) => {
        meCache = { token, user, at: Date.now() };
        return user;
      });
    },
    logout: (token: string) => request<{ message: string }>('/api/v1/auth/logout', { method: 'POST', token }),
  },
  talent: {
    apply: (body: TalentApplyBody, token?: string) =>
      request<TalentApplyResponse>('/api/v1/talent/apply', {
        method: 'POST',
        body: JSON.stringify(body),
        ...(token && { token }),
      }),
    marketplace: (skills?: string[]) =>
      request<{ items: TalentMarketplaceItem[] }>(
        `/api/v1/talent/marketplace${skills?.length ? `?skills=${skills.map(encodeURIComponent).join(',')}` : ''}`
      ),
    profile: (token: string) => request<TalentProfile>('/api/v1/talent/profile', { token }),
    updateProfile: (body: Partial<TalentApplyBody>, token: string) =>
      request<TalentProfile>('/api/v1/talent/profile', { method: 'PUT', body: JSON.stringify(body), token }),
    list: (token: string, status?: string) =>
      request<{ items: TalentListItem[] }>(`/api/v1/talent${status ? `?status=${encodeURIComponent(status)}` : ''}`, { token }),
    approve: (id: string, status: 'approved' | 'rejected', token: string) =>
      request<{ ok: boolean; status: string }>(`/api/v1/talent/${id}/approve`, { method: 'PUT', body: JSON.stringify({ status }), token }),
  },
  hirer: {
    register: (body: HirerRegisterBody, token?: string) =>
      request<HirerRegisterResponse>('/api/v1/hirer/register', {
        method: 'POST',
        body: JSON.stringify(body),
        ...(token && { token }),
      }),
    profile: (token: string) => request<HirerProfile>('/api/v1/hirer/profile', { token }),
    signFairTreatment: (token: string) =>
      request<{ ok: boolean; fairTreatmentSignedAt?: string }>('/api/v1/hirer/fair-treatment/sign', { method: 'POST', token }),
    list: (token: string) => request<{ items: HirerListItem[] }>('/api/v1/hirer', { token }),
  },
  hiring: {
    hire: (talentId: string, body: { projectTitle: string; projectDescription?: string }, token: string) =>
      request<HireResponse>(`/api/v1/hiring/hire/${talentId}`, { method: 'POST', body: JSON.stringify(body), token }),
    listHires: (token: string) => request<{ items: HireListItem[] }>('/api/v1/hiring/hires', { token }),
    createAgreement: (body: { hireId: string; title?: string }, token: string) =>
      request<{ agreement: { id: string; title: string; type: string }; hireId: string }>('/api/v1/hiring/agreement', { method: 'POST', body: JSON.stringify(body), token }),
    updateHireStatus: (hireId: string, status: 'in_progress' | 'completed' | 'cancelled', token: string) =>
      request<{ ok: boolean; status: string }>(`/api/v1/hiring/hires/${hireId}`, { method: 'PATCH', body: JSON.stringify({ status }), token }),
  },
  ratings: {
    list: (query: { toUserId?: string; hireId?: string }) =>
      request<{ items: RatingItem[] }>(`/api/v1/ratings?${new URLSearchParams(query as Record<string, string>).toString()}`),
    create: (body: { toUserId: string; hireId?: string; score: number; comment?: string }, token: string) =>
      request<RatingItem>('/api/v1/ratings', { method: 'POST', body: JSON.stringify(body), token }),
  },
  legal: {
    agreements: (token: string, params?: { type?: string; status?: string; documentStatus?: string }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString();
      return request<LegalAgreementsResponse>(`/api/v1/legal/agreements${q ? `?${q}` : ''}`, { token });
    },
  },
  marketplaceFee: {
    createSession: (body: { type: 'talent_marketplace_fee' | 'hirer_platform_fee'; currency?: string }, token: string) =>
      request<{ checkoutUrl: string; sessionId: string; amount: number; currency: string; type: string }>('/api/v1/marketplace-fee/create-session', { method: 'POST', body: JSON.stringify(body), token }),
    verify: (body: { reference: string }, token: string) =>
      request<{ ok: boolean; feePaid: boolean }>('/api/v1/marketplace-fee/verify', { method: 'POST', body: JSON.stringify(body), token }),
  },
  tenants: {
    current: (token: string) => request<{ tenant: { id: string; orgName: string; domain: string | null; planType: string } | null; branding: { logo: string | null; primaryColor: string | null } | null }>('/api/v1/tenants/current', { token }),
    list: (token: string) => request<TenantRow[]>(`/api/v1/tenants`, { token }),
    create: (body: { orgName: string; domain?: string; logo?: string; primaryColor?: string; planType?: string }, token: string) =>
      request<Tenant>('/api/v1/tenants', { method: 'POST', body: JSON.stringify(body), token }),
    update: (id: string, body: { orgName?: string; domain?: string | null; logo?: string | null; primaryColor?: string | null; planType?: string }, token: string) =>
      request<Tenant>(`/api/v1/tenants/${id}`, { method: 'PATCH', body: JSON.stringify(body), token }),
    billing: (tenantId: string, token: string) => request<TenantBillingRow[]>(`/api/v1/tenants/${tenantId}/billing`, { token }),
  },
  projects: {
    list: (token: string) => request<Project[]>('/api/v1/projects', { token }),
    get: (id: string, token: string) => request<Project>(`/api/v1/projects/${id}`, { token }),
    update: (id: string, body: Partial<ProjectUpdateBody>, token: string) =>
      request<Project>(`/api/v1/projects/${id}`, { method: 'PUT', body: JSON.stringify(body), token }),
  },
  workspace: {
    get: (projectId: string, token: string) =>
      request<WorkspaceOverview>(`/api/v1/workspace/${projectId}`, { token }),
    update: (projectId: string, body: WorkspaceUpdateBody, token: string) =>
      request<WorkspaceOverview>(`/api/v1/workspace/${projectId}`, { method: 'PATCH', body: JSON.stringify(body), token }),
    ideaVault: {
      list: (projectId: string, token: string) =>
        request<IdeaVaultItem[]>(`/api/v1/workspace/${projectId}/idea-vault`, { token }),
      create: (projectId: string, body: { type?: 'note' | 'pitch_draft'; title?: string; content?: string }, token: string) =>
        request<IdeaVaultItem>(`/api/v1/workspace/${projectId}/idea-vault`, { method: 'POST', body: JSON.stringify(body), token }),
      update: (projectId: string, itemId: string, body: { title?: string; content?: string; status?: 'draft' | 'submitted_for_review' }, token: string) =>
        request<IdeaVaultItem>(`/api/v1/workspace/${projectId}/idea-vault/${itemId}`, { method: 'PATCH', body: JSON.stringify(body), token }),
      delete: (projectId: string, itemId: string, token: string) =>
        request<void>(`/api/v1/workspace/${projectId}/idea-vault/${itemId}`, { method: 'DELETE', token }),
    },
    businessModel: {
      get: (projectId: string, token: string) =>
        request<WorkspaceBusinessModel>(`/api/v1/workspace/${projectId}/business-model`, { token }),
      update: (projectId: string, body: Partial<WorkspaceBusinessModel>, token: string) =>
        request<WorkspaceBusinessModel>(`/api/v1/workspace/${projectId}/business-model`, { method: 'PATCH', body: JSON.stringify(body), token }),
    },
    team: {
      list: (projectId: string, token: string) =>
        request<WorkspaceTeamMember[]>(`/api/v1/workspace/${projectId}/team`, { token }),
      add: (projectId: string, body: { userId: string; role?: 'member' | 'viewer' }, token: string) =>
        request<WorkspaceTeamMember>(`/api/v1/workspace/${projectId}/team`, { method: 'POST', body: JSON.stringify(body), token }),
      remove: (projectId: string, userId: string, token: string) =>
        request<void>(`/api/v1/workspace/${projectId}/team/${userId}`, { method: 'DELETE', token }),
    },
    files: {
      list: (projectId: string, token: string, category?: string) =>
        request<WorkspaceFile[]>(`/api/v1/workspace/${projectId}/files${category ? `?category=${encodeURIComponent(category)}` : ''}`, { token }),
    },
    investorView: (projectId: string, token: string) =>
      request<WorkspaceInvestorView>(`/api/v1/workspace/${projectId}/investor-view`, { token }),
    progress: (projectId: string, token: string) =>
      request<WorkspaceProgress>(`/api/v1/workspace/${projectId}/progress`, { token }),
  },
  milestones: {
    list: (projectId: string, token: string) => request<Milestone[]>(`/api/v1/projects/${projectId}/milestones`, { token }),
    create: (projectId: string, body: { title: string; status?: string; dueDate?: string }, token: string) =>
      request<Milestone>(`/api/v1/projects/${projectId}/milestones`, { method: 'POST', body: JSON.stringify(body), token }),
    update: (id: string, body: { title?: string; status?: string; dueDate?: string }, token: string) =>
      request<Milestone>(`/api/v1/milestones/${id}`, { method: 'PUT', body: JSON.stringify(body), token }),
    delete: (id: string, token: string) => request<void>(`/api/v1/milestones/${id}`, { method: 'DELETE', token }),
  },
  tasks: {
    list: (projectId: string, token: string) =>
      request<Task[]>(`/api/v1/projects/${projectId}/tasks`, { token }),
    listByProject: (projectId: string, token: string) =>
      request<Task[]>(`/api/v1/tasks?projectId=${projectId}`, { token }),
    myTasks: (token: string) => request<TaskWithProject[]>(`/api/v1/tasks/me`, { token }),
  },
  notifications: {
    list: (token: string, params?: { limit?: number; unreadOnly?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.limit != null) q.set('limit', String(params.limit));
      if (params?.unreadOnly) q.set('unreadOnly', 'true');
      const query = q.toString();
      return request<{ notifications: NotificationItem[]; unreadCount: number }>(
        `/api/v1/notifications${query ? `?${query}` : ''}`,
        { token }
      );
    },
    markRead: (id: string, token: string) =>
      request<{ ok: boolean }>(`/api/v1/notifications/${id}/read`, { method: 'PATCH', token }),
    markAllRead: (token: string) =>
      request<{ ok: boolean; count?: number }>('/api/v1/notifications/mark-all-read', { method: 'POST', token }),
  },
  faq: {
    list: (params?: { category?: string; q?: string; highlighted?: boolean; limit?: number }) => {
      const usp = new URLSearchParams();
      if (params?.category) usp.set('category', params.category);
      if (params?.q) usp.set('q', params.q);
      if (params?.highlighted) usp.set('highlighted', 'true');
      if (params?.limit) usp.set('limit', String(params.limit));
      const qs = usp.toString();
      return request<{ items: FaqItem[] }>(`/api/v1/faq${qs ? `?${qs}` : ''}`);
    },
  },
  badges: {
    list: (token: string) =>
      request<{ items: UserBadge[] }>('/api/v1/badges', { token }),
  },
  founders: {
    meReputation: (token: string) =>
      request<FounderReputationBreakdown>('/api/v1/founders/me/reputation', { token }),
    getReputation: (userId: string, token: string) =>
      request<FounderReputationBreakdown>(`/api/v1/founders/${userId}/reputation`, { token }),
  },
  forum: {
    list: (
      params: { category?: string; search?: string; page?: number; pageSize?: number } = {},
      token?: string
    ) => {
      const usp = new URLSearchParams();
      if (params.category) usp.set('category', params.category);
      if (params.search) usp.set('search', params.search);
      if (params.page) usp.set('page', String(params.page));
      if (params.pageSize) usp.set('pageSize', String(params.pageSize));
      const qs = usp.toString();
      return request<{ items: ForumPost[]; total: number; page: number; pageSize: number }>(
        `/api/v1/forum/posts${qs ? `?${qs}` : ''}`,
        token ? { token } : {}
      );
    },
    get: (id: string, token?: string) =>
      request<ForumPost & { comments: ForumComment[] }>(`/api/v1/forum/posts/${id}`, token ? { token } : {}),
    create: (body: { title: string; content: string; category?: string }, token: string) =>
      request<ForumPost>('/api/v1/forum/posts', {
        method: 'POST',
        token,
        body: JSON.stringify({ title: body.title, body: body.content, category: body.category }),
      }),
    comment: (postId: string, content: string, token: string) =>
      request<ForumComment>(`/api/v1/forum/posts/${postId}/comments`, {
        method: 'POST',
        token,
        body: JSON.stringify({ body: content }),
      }),
    toggleLike: (postId: string, token: string) =>
      request<{ liked: boolean }>(`/api/v1/forum/posts/${postId}/like`, {
        method: 'POST',
        token,
      }),
    remove: (postId: string, token: string) =>
      request<{ ok: boolean }>(`/api/v1/forum/posts/${postId}`, {
        method: 'DELETE',
        token,
      }),
  },
  payments: {
    list: (projectId: string, token: string) => request<PaymentRow[]>(`/api/v1/payments?projectId=${projectId}`, { token }),
    create: (body: { projectId: string; amount: number; currency?: string; type?: string }, token: string) =>
      request<{ paymentId: string; status: string }>('/api/v1/payments/create', { method: 'POST', body: JSON.stringify(body), token }),
  },
  ai: {
    evaluateIdea: (body: { ideaDescription: string; industry?: string; country?: string }, token: string) =>
      request<AIEvaluateIdeaResponse>('/api/v1/ai/evaluate-idea', { method: 'POST', body: JSON.stringify(body), token }),
    generateProposal: (body: { ideaSummary?: string; industry?: string; budgetRange?: string }, token: string) =>
      request<AIGenerateProposalResponse>('/api/v1/ai/generate-proposal', { method: 'POST', body: JSON.stringify(body), token }),
    pricing: (body: { amountUsd?: number; scope?: string; region?: string }, token: string) =>
      request<AIPricingResponse>('/api/v1/ai/pricing', { method: 'POST', body: JSON.stringify(body), token }),
    projectInsights: (body: { projectId?: string }, token: string) =>
      request<AIProjectInsightsResponse>('/api/v1/ai/project-insights', { method: 'POST', body: JSON.stringify(body), token }),
    marketingSuggestions: (body: { projectId?: string; traffic?: number; conversions?: number; cac?: number; roi?: number; byPlatform?: Record<string, unknown> }, token: string) =>
      request<AIMarketingSuggestionsResponse>('/api/v1/ai/marketing-suggestions', { method: 'POST', body: JSON.stringify(body), token }),
    // AI Startup Mentor
    startupCofounder: (body: { idea: string; currentRole?: string; skillsYouHave?: string[]; skillsNeeded?: string[] }, token: string) =>
      request<AIStartupCofounderResponse>('/api/v1/ai/startup-cofounder', { method: 'POST', body: JSON.stringify(body), token }),
    businessPlan: (body: { idea: string; industry?: string; targetMarket?: string; businessModel?: string }, token: string) =>
      request<AIBusinessPlanResponse>('/api/v1/ai/business-plan', { method: 'POST', body: JSON.stringify(body), token }),
    marketAnalysis: (body: { idea: string; region?: string; industry?: string }, token: string) =>
      request<AIMarketAnalysisResponse>('/api/v1/ai/market-analysis', { method: 'POST', body: JSON.stringify(body), token }),
    riskAnalysis: (body: { idea: string; projectId?: string; stage?: string }, token: string) =>
      request<AIRiskAnalysisResponse>('/api/v1/ai/risk-analysis', { method: 'POST', body: JSON.stringify(body), token }),
    ideaChat: (body: { messages: { role: 'user' | 'assistant'; content: string }[] }, token: string) =>
      request<AIIdeaChatResponse>('/api/v1/ai/idea-chat', { method: 'POST', body: JSON.stringify(body), token }),
    smartMilestones: (body: { ideaSummary?: string; projectId?: string; horizonWeeks?: number }, token: string) =>
      request<AISmartMilestonesResponse>('/api/v1/ai/smart-milestones', { method: 'POST', body: JSON.stringify(body), token }),
    // AI Co-Founder (persistent chat + outputs; paid gate for pricing/marketing/pitch/risk)
    ideaClarify: (body: { idea: string; projectId?: string; industry?: string; country?: string }, token: string) =>
      request<Record<string, unknown>>('/api/v1/ai/idea-clarify', { method: 'POST', body: JSON.stringify(body), token }),
    businessModel: (body: { idea: string; projectId?: string; industry?: string; country?: string }, token: string) =>
      request<Record<string, unknown>>('/api/v1/ai/business-model', { method: 'POST', body: JSON.stringify(body), token }),
    roadmap: (body: { idea: string; projectId?: string; industry?: string; country?: string }, token: string) =>
      request<Record<string, unknown>>('/api/v1/ai/roadmap', { method: 'POST', body: JSON.stringify(body), token }),
    cofounderPricing: (body: { idea: string; projectId?: string; industry?: string; country?: string }, token: string) =>
      request<Record<string, unknown>>('/api/v1/ai/pricing', { method: 'POST', body: JSON.stringify(body), token }),
    cofounderMarketing: (body: { idea: string; projectId?: string; industry?: string; country?: string }, token: string) =>
      request<Record<string, unknown>>('/api/v1/ai/marketing', { method: 'POST', body: JSON.stringify(body), token }),
    cofounderPitch: (body: { idea: string; projectId?: string; industry?: string; country?: string }, token: string) =>
      request<Record<string, unknown>>('/api/v1/ai/pitch', { method: 'POST', body: JSON.stringify(body), token }),
    cofounderRiskAnalysis: (body: { idea: string; projectId?: string; industry?: string; country?: string }, token: string) =>
      request<Record<string, unknown>>('/api/v1/ai/risk-analysis', { method: 'POST', body: JSON.stringify(body), token }),
    conversations: (token: string, params?: { projectId?: string; limit?: number }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString();
      return request<{ messages: { id: string; message: string; role: string; createdAt: string }[] }>(`/api/v1/ai/conversations${q ? `?${q}` : ''}`, { token });
    },
    sendConversation: (body: { message: string; projectId?: string }, token: string) =>
      request<{ message: string; id: string; createdAt: string }>('/api/v1/ai/conversations', { method: 'POST', body: JSON.stringify(body), token }),
    outputs: (token: string, params?: { projectId?: string; type?: string; limit?: number }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString();
      return request<{ outputs: { id: string; type: string; content: unknown; createdAt: string; projectId: string | null }[] }>(`/api/v1/ai/outputs${q ? `?${q}` : ''}`, { token });
    },
    fullBusinessPlan: (body: { idea: string; projectId?: string; industry?: string; country?: string }, token: string) =>
      request<Record<string, unknown>>('/api/v1/ai/full-business-plan', { method: 'POST', body: JSON.stringify(body), token }),
  },
  campaigns: {
    create: (body: { projectId: string; platform: string; budget: number; startDate: string; endDate: string }, token: string) =>
      request<Campaign>('/api/v1/campaigns', { method: 'POST', body: JSON.stringify(body), token }),
    listByProject: (projectId: string, token: string) =>
      request<CampaignWithLeads[]>(`/api/v1/campaigns/project/${projectId}`, { token }),
  },
  leads: {
    import: (body: { campaignId: string; leads: Array<{ source?: string; cost: number; conversionStatus?: string }> }, token: string) =>
      request<{ imported: number; leads: Lead[] }>('/api/v1/leads/import', { method: 'POST', body: JSON.stringify(body), token }),
  },
  analytics: {
    get: (projectId: string, token: string) =>
      request<MarketingAnalytics>(`/api/v1/analytics/${projectId}`, { token }),
  },
  agreements: {
    list: (token: string) => request<Agreement[]>(`/api/v1/agreements`, { token }),
    get: (id: string, token: string) => request<AgreementDetail>(`/api/v1/agreements/${id}`, { token }),
    create: (body: { title: string; type: AgreementType; templateUrl?: string }, token: string) =>
      request<Agreement>(`/api/v1/agreements`, { method: 'POST', body: JSON.stringify(body), token }),
    update: (id: string, body: { title?: string; type?: AgreementType; templateUrl?: string }, token: string) =>
      request<Agreement>(`/api/v1/agreements/${id}`, { method: 'PUT', body: JSON.stringify(body), token }),
    delete: (id: string, token: string) =>
      request<void>(`/api/v1/agreements/${id}`, { method: 'DELETE', token }),
    listAssignments: (token: string, params?: { status?: string; type?: string; documentStatus?: string }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString();
      return request<AssignedAgreementRow[]>(`/api/v1/agreements/assignments${q ? `?${q}` : ''}`, { token });
    },
    assign: (agreementId: string, body: { userId?: string; userIds?: string[]; deadline?: string; roles?: Record<string, string> | string }, token: string) =>
      request<{ assigned: { id: string; userId: string; deadline: string | null }[] }>(`/api/v1/agreements/${agreementId}/assign`, {
        method: 'POST',
        body: JSON.stringify(body),
        token,
      }),
    view: (id: string, token: string) =>
      request<{ id: string; title: string; type: string; templateUrl: string | null; contentHtml: string | null }>(`/api/v1/agreements/${id}/view`, { token }),
    sign: (id: string, body: { signatureText?: string; signatureUrl?: string; deviceInfo?: string }, token: string) =>
      request<{ message: string; assignment: unknown; allSigned?: boolean }>(`/api/v1/agreements/${id}/sign`, { method: 'POST', body: JSON.stringify(body), token }),
    status: (id: string, token: string) => request<unknown[]>(`/api/v1/agreements/${id}/status`, { token }),
    logs: (id: string, token: string) => request<AgreementAuditLog[]>(`/api/v1/agreements/${id}/logs`, { token }),
    listAssignedToMe: (token: string) => request<AssignedToMe[]>(`/api/v1/agreements/assigned`, { token }),
    /** Fetch agreement HTML and trigger download (uses fetch + blob so auth is sent). */
    exportDownload: async (id: string, token: string): Promise<void> => {
      const base = API_BASE || '';
      const res = await fetch(`${base}/api/v1/agreements/${id}/export`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(res.statusText);
      const blob = await res.blob();
      const name = res.headers.get('Content-Disposition')?.match(/filename="?([^";]+)/)?.[1] || `agreement-${id}.html`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    },
    createFromTemplate: (
      body: { title: string; type: string; dynamicData?: Record<string, string> },
      token: string
    ) =>
      request<Agreement>(`/api/v1/agreements/from-template`, { method: 'POST', body: JSON.stringify(body), token }),
  },
  investors: {
    register: (body: InvestorRegisterBody) =>
      request<AuthResponse>('/api/v1/investors/register', { method: 'POST', body: JSON.stringify(body) }),
    me: (token: string) => request<Investor>('/api/v1/investors/me', { token }),
    list: (token: string) => request<Investor[] | Investor>('/api/v1/investors', { token }),
  },
  startups: {
    list: (token: string) => request<StartupProfile[]>(`/api/v1/startups`, { token }),
    myProfiles: (token: string) => request<StartupProfile[]>(`/api/v1/startups/me`, { token }),
    publish: (body: StartupPublishBody, token: string) =>
      request<StartupProfile>('/api/v1/startups/publish', { method: 'POST', body: JSON.stringify(body), token }),
    marketplace: (params?: { industry?: string; stage?: string; fundingMin?: number; fundingMax?: number }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString();
      return request<StartupProfileListItem[]>(`/api/v1/startups/marketplace${q ? `?${q}` : ''}`);
    },
    get: (id: string, token?: string) =>
      request<StartupProfileDetail>(`/api/v1/startups/${id}`, token ? { token } : {}),
    getScore: (id: string, token?: string) =>
      request<StartupScoreResponse>(`/api/v1/startups/${id}/score`, token ? { token } : {}),
    recalcScore: (id: string, token: string) =>
      request<StartupScoreResponse>(`/api/v1/startups/${id}/score/recalculate`, { method: 'POST', token }),
    approve: (id: string, token: string) =>
      request<StartupProfile>(`/api/v1/startups/${id}/approve`, { method: 'PUT', token }),
  },
  investments: {
    expressInterest: (body: { startupId: string; requestMeeting?: boolean }, token: string) =>
      request<Investment>(`/api/v1/investments/express-interest`, { method: 'POST', body: JSON.stringify(body), token }),
    commit: (body: { startupId: string; amount?: number; equityPercent?: number; agreementId?: string }, token: string) =>
      request<Investment>(`/api/v1/investments/commit`, { method: 'POST', body: JSON.stringify(body), token }),
    list: (token: string) => request<InvestmentListItem[]>(`/api/v1/investments`, { token }),
    updateStatus: (id: string, body: { status: string }, token: string) =>
      request<Investment>(`/api/v1/investments/${id}/status`, { method: 'PATCH', body: JSON.stringify(body), token }),
  },
  dealRoom: {
    list: (token: string) => request<DealRoomStartup[]>(`/api/v1/deal-room`, { token }),
    getStartup: (startupId: string, token: string) =>
      request<DealRoomStartupDetail>(`/api/v1/deal-room/${startupId}`, { token }),
    save: (startupId: string, token: string) =>
      request<{ saved: boolean; startupId: string }>(`/api/v1/deal-room/save`, { method: 'POST', body: JSON.stringify({ startupId }), token }),
    unsave: (startupId: string, token: string) =>
      request<void>(`/api/v1/deal-room/save/${startupId}`, { method: 'DELETE', token }),
    listSaved: (token: string) => request<string[]>(`/api/v1/deal-room/saved`, { token }),
    sendMessage: (investmentId: string, message: string, token: string) =>
      request<DealRoomMessage>(`/api/v1/deal-room/messages`, { method: 'POST', body: JSON.stringify({ investmentId, message }), token }),
    listMessages: (investmentId: string, token: string) =>
      request<DealRoomMessage[]>(`/api/v1/deal-room/messages/${investmentId}`, { token }),
    adminDeals: (token: string) => request<DealRoomAdminDeal[]>(`/api/v1/deal-room/admin/deals`, { token }),
    requestAccess: (startupId: string, token: string) =>
      request<{ status: 'requested' | 'approved' | 'rejected' }>(`/api/v1/deal-room/${startupId}/request-access`, {
        method: 'POST',
        token,
      }),
    accessStatus: (startupId: string, token: string) =>
      request<{ status: 'none' | 'requested' | 'approved' | 'rejected' }>(`/api/v1/deal-room/${startupId}/access-status`, {
        token,
      }),
    listAccessRequests: (startupId: string, token: string) =>
      request<{ items: DealRoomAccessItem[] }>(`/api/v1/deal-room/${startupId}/access-requests`, { token }),
  },
  admin: {
    leads: {
      list: (token: string, params?: { status?: string }) => {
        const q = new URLSearchParams(params as Record<string, string>).toString();
        return request<AdminLeadRow[]>(`/api/v1/admin/leads${q ? `?${q}` : ''}`, { token });
      },
      get: (id: string, token: string) => request<AdminLeadDetail>(`/api/v1/admin/leads/${id}`, { token }),
      create: (body: { name: string; email: string; country?: string; ideaSummary?: string; stage?: string; goal?: string; budget?: string }, token: string) =>
        request<AdminLeadRow>('/api/v1/admin/leads', { method: 'POST', body: JSON.stringify(body), token }),
      updateStatus: (id: string, body: { status: AdminLeadStatus }, token: string) =>
        request<AdminLeadRow>(`/api/v1/admin/leads/${id}/status`, { method: 'PUT', body: JSON.stringify(body), token }),
      assign: (id: string, body: { assignedToId: string | null }, token: string) =>
        request<AdminLeadRow>(`/api/v1/admin/leads/${id}/assign`, { method: 'PUT', body: JSON.stringify(body), token }),
      addNote: (id: string, body: { content: string }, token: string) =>
        request<AdminLeadNoteRow>(`/api/v1/admin/leads/${id}/notes`, { method: 'POST', body: JSON.stringify(body), token }),
    },
  },
  users: {
    list: (token: string, params?: { role?: string }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString();
      return request<User[]>(`/api/v1/users${q ? `?${q}` : ''}`, { token });
    },
    updateMe: (body: { welcomePanelSeen?: boolean }, token: string) =>
      request<{ id: string; name: string; email: string; role: string; welcomePanelSeen?: boolean }>(
        `/api/v1/users/me`,
        { method: 'PATCH', body: JSON.stringify(body), token }
      ),
    meFeatures: (token: string) => request<UserFeatureState>('/api/v1/users/me/features', { token }),
  },
  setupFee: {
    config: () =>
      request<PricingConfig>(`/api/v1/setup-fee/config`),
    quote: (currency: string, token?: string) =>
      request<{ amountUsd: number; amount: number; currency: string; rate: number }>(
        `/api/v1/setup-fee/quote?currency=${encodeURIComponent(currency)}`,
        token ? { token } : {}
      ),
    createSession: (body: { currency?: string }, token: string) =>
      request<{ sessionId: string; checkoutUrl: string; amount: number; currency: string; amountUsd: number }>(
        '/api/v1/setup-fee/create-session',
        { method: 'POST', body: JSON.stringify(body), token }
      ),
    verify: (body: { reference: string }, token: string) =>
      request<{ ok: boolean; setupPaid: boolean }>('/api/v1/setup-fee/verify', { method: 'POST', body: JSON.stringify(body), token }),
    skip: (body: { reason: 'cant_afford' | 'pay_later' | 'exploring' | 'other' }, token: string) =>
      request<{ ok: boolean; setupReason: string }>('/api/v1/setup-fee/skip', { method: 'PUT', body: JSON.stringify(body), token }),
  },
  cms: {
    getByKey: (key: string) =>
      request<{ key: string; value: string | unknown; type: string; page: string | null; updatedAt: string | null }>(`/api/v1/cms/${encodeURIComponent(key)}`),
    getByPage: (pageName: string) =>
      request<{ page: string; contents: Record<string, unknown> }>(`/api/v1/cms/page/${encodeURIComponent(pageName)}`),
    create: (body: { key: string; value: string | unknown; type?: string; page?: string }, token: string) =>
      request<{ key: string; value: unknown; type: string; page: string; updatedAt: string }>('/api/v1/cms', {
        method: 'POST',
        body: JSON.stringify(body),
        token,
      }),
    update: (key: string, body: { value: string | unknown }, token: string) =>
      request<{ key: string; value: unknown; type: string; page: string; updatedAt: string }>(`/api/v1/cms/${encodeURIComponent(key)}`, {
        method: 'PUT',
        body: JSON.stringify(body),
        token,
      }),
    delete: (key: string, token: string) =>
      request<void>(`/api/v1/cms/${encodeURIComponent(key)}`, { method: 'DELETE', token }),
    bulkUpdatePage: (pageName: string, body: { contents: Array<{ key: string; value: unknown }> }, token: string) =>
      request<{ page: string; contents: Record<string, unknown> }>(`/api/v1/cms/page/${encodeURIComponent(pageName)}`, {
        method: 'PUT',
        body: JSON.stringify(body),
        token,
      }),
    trackRevenueModelView: (source: 'homepage' | 'pricing' | 'onboarding' | 'dashboard' | 'deal_room', token?: string | null) =>
      request<void>('/api/v1/cms/revenue-model-view', {
        method: 'POST',
        body: JSON.stringify({ source }),
        ...(token ? { token } : {}),
      }),
    revenueSystem: {
      get: (token: string) =>
        request<{
          draft: { visibility?: Record<string, boolean>; revenueModel?: unknown; pricingJourney?: unknown } | null;
          live: { revenueModel: unknown; pricingJourney: unknown };
          versionHistory: Array<{ id: string; versionType: string; editedAt: string; editedBy: string }>;
        }>('/api/v1/cms/revenue-system', { token }),
      saveDraft: (
        body: { visibility?: Record<string, boolean>; revenueModel?: unknown; pricingJourney?: unknown },
        token: string
      ) =>
        request<{ ok: boolean; message: string }>('/api/v1/cms/revenue-system/draft', {
          method: 'PUT',
          body: JSON.stringify(body),
          token,
        }),
      publish: (token: string) =>
        request<{ ok: boolean; message: string }>('/api/v1/cms/revenue-system/publish', {
          method: 'POST',
          token,
        }),
      getHistory: (token: string) =>
        request<{
          items: Array<{
            id: string;
            payload: unknown;
            versionType: string;
            editedAt: string;
            editedBy: string;
          }>;
        }>('/api/v1/cms/revenue-system/history', { token }),
      restore: (versionId: string, token: string) =>
        request<{ ok: boolean; message: string }>(`/api/v1/cms/revenue-system/restore/${encodeURIComponent(versionId)}`, {
          method: 'POST',
          token,
        }),
    },
  },
  socialLinks: {
    list: () => request<SocialMediaLink[]>('/api/v1/social-links'),
    adminList: (token: string) =>
      request<SocialMediaLink[]>('/api/v1/super-admin/social-links', { token }),
    create: (
      body: { platformName: string; url: string; iconUrl?: string; active?: boolean },
      token: string
    ) =>
      request<SocialMediaLink>('/api/v1/super-admin/social-links', {
        method: 'POST',
        body: JSON.stringify(body),
        token,
      }),
    update: (
      id: string,
      body: { platformName?: string; url?: string; iconUrl?: string | null; active?: boolean },
      token: string
    ) =>
      request<SocialMediaLink>(`/api/v1/super-admin/social-links/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
        token,
      }),
    remove: (id: string, token: string) =>
      request<void>(`/api/v1/super-admin/social-links/${id}`, {
        method: 'DELETE',
        token,
      }),
    toggle: (id: string, token: string) =>
      request<SocialMediaLink>(`/api/v1/super-admin/social-links/${id}/toggle`, {
        method: 'PATCH',
        token,
      }),
    trackClick: (id: string) =>
      fetch(`${API_BASE}/api/v1/social-links/${id}/click`, {
        method: 'POST',
        keepalive: true,
      }).catch(() => {}),
  },
  shareMeta: {
    getByPage: (page: string) =>
      request<SocialShareMeta>(`/api/v1/share-meta/${encodeURIComponent(page)}`),
    adminList: (token: string) =>
      request<SocialShareMeta[]>('/api/v1/super-admin/share-meta', { token }),
    create: (
      body: { pageName: string; title: string; description: string; imageUrl: string; canonicalUrl: string },
      token: string
    ) =>
      request<SocialShareMeta>('/api/v1/super-admin/share-meta', {
        method: 'POST',
        body: JSON.stringify(body),
        token,
      }),
    update: (
      id: string,
      body: Partial<{ pageName: string; title: string; description: string; imageUrl: string; canonicalUrl: string }>,
      token: string
    ) =>
      request<SocialShareMeta>(`/api/v1/super-admin/share-meta/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
        token,
      }),
    remove: (id: string, token: string) =>
      request<void>(`/api/v1/super-admin/share-meta/${id}`, {
        method: 'DELETE',
        token,
      }),
  },
  superAdmin: {
    overview: (token: string) => request<SuperAdminOverview>(`/api/v1/super-admin/overview`, { token }),
    payments: (token: string, params?: { period?: string; userId?: string; paymentType?: string; format?: string }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString();
      return request<{ rows: SuperAdminPaymentRow[]; total?: number } | string>(`/api/v1/super-admin/payments${q ? `?${q}` : ''}`, { token });
    },
    activity: (token: string, params?: { actionType?: string; limit?: number }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString();
      return request<{ items: SuperAdminActivityItem[] }>(`/api/v1/super-admin/activity${q ? `?${q}` : ''}`, { token });
    },
    auditLogs: (token: string, params?: { page?: number; limit?: number; entityType?: string; actionType?: string }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString();
      return request<SuperAdminAuditLogsResponse>(`/api/v1/super-admin/audit-logs${q ? `?${q}` : ''}`, { token });
    },
    reports: (token: string, params?: { period?: string }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString();
      return request<SuperAdminReportsResponse>(`/api/v1/super-admin/reports${q ? `?${q}` : ''}`, { token });
    },
    consultations: (token: string) =>
      request<SuperAdminConsultationRow[]>(`/api/v1/super-admin/consultations`, { token }),
    messages: {
      list: (token: string, params?: { status?: string; limit?: number }) => {
        const q = new URLSearchParams(params as Record<string, string>).toString();
        return request<{ items: AdminMessageRow[] }>(`/api/v1/super-admin/messages${q ? `?${q}` : ''}`, {
          token,
        });
      },
      updateStatus: (id: string, status: string, token: string) =>
        request<AdminMessageRow>(`/api/v1/super-admin/messages/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
          token,
        }),
    },
    skills: {
      list: (token: string, params?: { category?: string }) => {
        const q = new URLSearchParams(params as Record<string, string>).toString();
        return request<{ items: { id: string; name: string; category: string | null; createdAt: string }[] }>(
          `/api/v1/super-admin/skills${q ? `?${q}` : ''}`,
          { token }
        );
      },
      create: (body: { name: string; category?: string }, token: string) =>
        request<{ id: string; name: string; category: string | null; createdAt: string }>(`/api/v1/super-admin/skills`, {
          method: 'POST',
          body: JSON.stringify(body),
          token,
        }),
      update: (id: string, body: { name?: string; category?: string }, token: string) =>
        request<{ id: string; name: string; category: string | null; createdAt: string }>(`/api/v1/super-admin/skills/${id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
          token,
        }),
      delete: (id: string, token: string) =>
        request<{ ok: boolean; id: string }>(`/api/v1/super-admin/skills/${id}`, { method: 'DELETE', token }),
    },
    userFeatures: (userId: string, token: string) =>
      request<UserFeatureState>(`/api/v1/super-admin/users/${userId}/features`, { token }),
    emailLogs: {
      list: (token: string, params?: { page?: number; limit?: number; status?: string; type?: string; toEmail?: string }) => {
        const q = new URLSearchParams(params as Record<string, string>).toString();
        return request<{ rows: EmailLogRow[]; total: number; page: number; limit: number }>(
          `/api/v1/super-admin/email-logs${q ? `?${q}` : ''}`,
          { token }
        );
      },
      resend: (id: string, token: string) =>
        request<{ ok: boolean; message: string; logId?: string }>(`/api/v1/super-admin/email-logs/${id}/resend`, {
          method: 'POST',
          token,
        }),
    },
    equity: {
      company: {
        list: (token: string) =>
          request<CompanyEquityRow[]>(`/api/v1/super-admin/equity/company`, { token }),
        create: (body: { personName: string; role: string; shares: number; equityPercent: number; vestingStart?: string; vestingYears: number }, token: string) =>
          request<CompanyEquityRow>(`/api/v1/super-admin/equity/company`, { method: 'POST', body: JSON.stringify(body), token }),
      },
      startup: {
        list: (startupId: string, token: string) =>
          request<{ items: StartupEquityRow[] }>(`/api/v1/super-admin/equity/startup/${startupId}`, { token }),
        create: (startupId: string, body: { personName: string; role: string; shares?: number; equityPercent: number; vestingStart?: string; vestingYears: number }, token: string) =>
          request<StartupEquityRow>(`/api/v1/super-admin/equity/startup/${startupId}`, { method: 'POST', body: JSON.stringify(body), token }),
      },
    },
    security: {
      overview: (token: string) =>
        request<SecurityOverview>(`/api/v1/super-admin/security/overview`, { token }),
      events: (token: string, params?: { type?: string; severity?: string; limit?: number }) => {
        const q = new URLSearchParams(params as Record<string, string>).toString();
        return request<{ items: SecurityEventItem[] }>(
          `/api/v1/super-admin/security/events${q ? `?${q}` : ''}`,
          { token }
        );
      },
      blockedIps: (token: string) =>
        request<{ items: BlockedIpRow[] }>(`/api/v1/super-admin/security/blocked-ips`, {
          token,
        }),
      unblockIp: (id: string, token: string) =>
        request<{ ok: boolean }>(`/api/v1/super-admin/security/blocked-ips/${id}`, {
          method: 'DELETE',
          token,
        }),
    },
    finance: {
      summary: (token: string) =>
        request<FinanceSummary>(`/api/v1/super-admin/finance/summary`, { token }),
      downloadTaxSummary: async (token: string, start: string, end: string): Promise<Blob> => {
        const url = `${API_BASE}/api/v1/super-admin/finance/tax-summary?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error || res.statusText);
        }
        return res.blob();
      },
    },
    systemHealth: (token: string) =>
      request<SystemHealthStatus>(`/api/v1/super-admin/system-health`, { token }),
  },
  team: {
    list: (token: string) => request<TeamMemberRow[]>(`/api/v1/team`, { token }),
    invite: (body: { email: string; role?: string; customRoleId?: string }, token: string) =>
      request<{ ok: boolean; message: string }>(`/api/v1/team/invite`, { method: 'POST', body: JSON.stringify(body), token }),
    getAcceptInvite: (token: string) =>
      request<{ valid: boolean; email?: string; role?: string; roleLabel?: string } | { error: string; valid: false }>(
        `/api/v1/team/invite/accept?token=${encodeURIComponent(token)}`
      ),
    postAcceptInvite: (body: { token: string; name: string; password: string }) =>
      request<AuthResponse>(`/api/v1/team/invite/accept`, { method: 'POST', body: JSON.stringify(body) }),
    updateMember: (userId: string, body: { role?: string; customRoleId?: string | null }, token: string) =>
      request<TeamMemberRow>(`/api/v1/team/${userId}`, { method: 'PATCH', body: JSON.stringify(body), token }),
    deleteMember: (userId: string, token: string) =>
      request<void>(`/api/v1/team/${userId}`, { method: 'DELETE', token }),
    listCustomRoles: (token: string) => request<CustomRoleRow[]>(`/api/v1/team/roles`, { token }),
    createCustomRole: (body: { name: string; department?: string; level?: string }, token: string) =>
      request<CustomRoleRow>(`/api/v1/team/roles`, { method: 'POST', body: JSON.stringify(body), token }),
  },
};

export interface SuperAdminConsultationRow {
  id: string;
  fullName: string;
  email: string;
  country: string | null;
  businessIdea: string | null;
  stage: string | null;
  mainGoal: string | null;
  budgetRange: string | null;
  preferredContactMethod: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  timezone: string | null;
  createdAt: string;
}

export interface AdminMessageRow {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  phone: string | null;
  attachmentUrl: string | null;
  status: string;
  createdAt: string;
}

export interface EmailLogRow {
  id: string;
  type: string;
  toEmail: string;
  subject: string;
  status: string;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}

export interface TeamMemberRow {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  customRole: { id: string; name: string; department: string | null; level: string | null } | null;
}

export interface CustomRoleRow {
  id: string;
  name: string;
  department: string | null;
  level: string | null;
  createdAt: string;
}

export interface SuperAdminOverview {
  totalUsers: number;
  totalClients: number;
  totalInvestors: number;
  ideasSubmitted: number;
  activeProjects: number;
  agreementsSigned: number;
  totalRevenueUsd: number;
  revenueMonthlyUsd: number;
  revenueYearlyUsd: number;
  setupFeesCollectedUsd: number;
  consultationPaymentsUsd: number;
  investorFeesUsd: number;
  pendingManualPayments: number;
  pendingTalents: number;
  pendingStartups: number;
  earlyFounderCount: number;
}

export interface FinanceSummary {
  totalRevenueUsd: number;
  revenueThisMonthUsd: number;
  revenueThisYearUsd: number;
  totalPaidUsers: number;
  pendingApprovals: number;
  paymentMethodBreakdown: { method: string; count: number; totalAmount: number }[];
  revenueByMonth: { month: string; totalUsd: number }[];
  refundsTotalUsd: number;
}

export interface SystemHealthStatus {
  email: { ok: boolean; error?: string };
  ai: { ok: boolean; error?: string; provider: string };
  payments: { ok: boolean; gateway: 'paystack' | 'stripe' | 'none'; error?: string };
  database: { ok: boolean; error?: string };
}

export interface SuperAdminPaymentRow {
  userName: string;
  role: string;
  paymentType: string;
  amount: number;
  currency: string;
  convertedUsd: number;
  status: string;
  date: string;
}

export interface SuperAdminActivityItem {
  id: string;
  actionType: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  timestamp: string;
  userEmail: string | null;
  userName: string | null;
}

export interface SuperAdminAuditLogEntry {
  id: string;
  adminId: string | null;
  adminEmail: string | null;
  actionType: string;
  entityType: string;
  entityId: string | null;
  details: unknown;
  timestamp: string;
}

export interface SuperAdminAuditLogsResponse {
  items: SuperAdminAuditLogEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface SecurityOverview {
  eventsLast24h: number;
  eventsLast7d: number;
  blockedActive: number;
  blockedAttacksToday: number;
  suspiciousSessions: number;
  activeUsersEstimate: number;
  systemStatus: 'secure' | 'warning' | 'under_attack';
  protections: {
    waf: boolean;
    ddos: boolean;
    rateLimiting: boolean;
    aiMonitoring: boolean;
    dbEncryption: boolean;
    backups: boolean;
  };
  topIps: { ip: string | null; count: number }[];
}

export interface SecurityEventItem {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  ip: string | null;
  createdAt: string;
  autoBlocked: boolean;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
  } | null;
}

export interface BlockedIpRow {
  id: string;
  ip: string;
  reason: string | null;
  source: string;
  blockedAt: string;
  expiresAt: string | null;
}

export interface SuperAdminReportsResponse {
  period: string;
  financialSummary: Array<{ period: string; revenueUsd: number; setupFeesUsd: number; milestoneUsd: number }>;
  paymentTrends: Array<{ period: string; revenueUsd: number; setupFeesUsd: number; milestoneUsd: number }>;
  growthMetrics: { totalUsers: number; totalProjects: number; newUsersLast30Days: number; newProjectsLast30Days: number };
  platformUsage: { totalUsers: number; totalProjects: number; totalAgreementsSigned: number; totalConsultationsBooked: number };
}

export interface InvestorRegisterBody {
  name: string;
  email: string;
  password: string;
  firmName?: string;
  investmentRangeMin?: number;
  investmentRangeMax?: number;
  industries?: string;
  country?: string;
}

export interface Investor {
  id: string;
  userId: string;
  name: string;
  email: string;
  firmName: string | null;
  investmentRangeMin: number | null;
  investmentRangeMax: number | null;
  industries: string | null;
  country: string | null;
  verified: boolean;
  createdAt: string;
}

export interface StartupProfile {
  id: string;
  projectId: string;
  pitchSummary: string;
  tractionMetrics: string | null;
  fundingNeeded: number;
  equityOffer: number | null;
  stage: string;
  visibilityStatus: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  createdAt: string;
  project?: { projectName: string; client?: { businessName: string } };
}

export interface StartupProfileListItem extends StartupProfile {
  project: {
    id: string;
    projectName: string;
    stage: string;
    description: string | null;
    client: { businessName: string; industry: string | null };
  };
}

export interface StartupProfileDetail extends StartupProfile {
  fullView?: boolean;
  country?: string | null;
  liveUrl?: string | null;
  repoUrl?: string | null;
  screenshots?: string[] | null;
  pitchDeckUrl?: string | null;
  aiFeasibilityScore?: number | null;
  aiRiskLevel?: string | null;
  aiMarketPotential?: string | null;
  project: {
    id: string;
    projectName: string;
    description?: string | null;
    stage: string;
    status?: string;
    liveUrl?: string | null;
    repoUrl?: string | null;
    client: { businessName: string; industry: string | null; userId?: string; user?: { name: string } };
    milestones?: { id: string; title: string; status: string; dueDate: string | null }[];
  };
}

export interface StartupScoreBreakdown {
  problemClarity: number;
  marketSize: number;
  businessModel: number;
  innovation: number;
  feasibility: number;
  traction: number;
  teamStrength: number;
  financialLogic: number;
  total: number;
}

export interface StartupScoreResponse {
  scoreTotal: number;
  breakdown: StartupScoreBreakdown | null;
  suggestions: string[];
}

export interface StartupPublishBody {
  projectId: string;
  pitchSummary: string;
  tractionMetrics?: string;
  fundingNeeded: number;
  equityOffer?: number;
  stage?: string;
  country?: string;
  liveUrl?: string;
  repoUrl?: string;
  screenshots?: string[];
  pitchDeckUrl?: string;
  aiFeasibilityScore?: number;
  aiRiskLevel?: string;
  aiMarketPotential?: string;
}

export interface Investment {
  id: string;
  investorId: string;
  startupId: string;
  amount: number | null;
  equityPercent: number | null;
  status: string;
  agreementId: string | null;
  createdAt: string;
  startup?: { project?: { projectName: string } };
}

export interface InvestmentListItem extends Investment {
  startup: {
    project: { projectName: string; client?: { businessName: string } };
  };
}

export type AgreementType = 'NDA' | 'MOU' | 'CoFounder' | 'Terms' | 'FairTreatment' | 'HireContract' | 'Partnership' | 'Investor';

export interface Agreement {
  id: string;
  title: string;
  type: AgreementType;
  templateUrl?: string | null;
  contentHtml?: string | null;
  createdById?: string | null;
  status?: string;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AgreementDetail extends Agreement {
  assignedAgreements?: { id: string; userId: string; user: { id: string; name: string; email: string } }[];
}

export interface AssignedAgreementRow {
  id: string;
  status: 'Pending' | 'Signed' | 'Overdue';
  signedAt: string | null;
  deadline: string | null;
  agreement: { id: string; title: string; type: string; templateUrl: string | null };
  user: { id: string; name: string; email: string };
}

export interface AssignedToMe {
  id: string;
  status: 'Pending' | 'Signed' | 'Overdue';
  signedAt: string | null;
  agreement: { id: string; title: string; type: string; templateUrl: string | null };
}

export interface AgreementAuditLog {
  id: string;
  userId: string;
  user: { id: string; name: string; email: string };
  action: string;
  ipAddress: string | null;
  createdAt: string;
}

export type ProjectStatus =
  | 'IdeaSubmitted'
  | 'ReviewValidation'
  | 'ProposalSent'
  | 'Development'
  | 'Testing'
  | 'Live'
  | 'Maintenance';

export interface Project {
  id: string;
  projectName: string;
  description: string | null;
  stage: string;
  status?: ProjectStatus;
  progressPercent: number;
  budget?: number | null;
  startDate: string | null;
  deadline: string | null;
  repoUrl?: string | null;
  liveUrl?: string | null;
  client?: { user?: { name: string; email: string } };
  tasks?: Task[];
  milestones?: Milestone[];
}

export interface ProjectUpdateBody {
  projectName?: string;
  description?: string;
  stage?: string;
  status?: ProjectStatus;
  progressPercent?: number;
  budget?: number | null;
  startDate?: string | null;
  deadline?: string | null;
  repoUrl?: string | null;
  liveUrl?: string | null;
}

export interface WorkspaceOverview {
  id: string;
  projectName: string;
  tagline?: string | null;
  description?: string | null;
  problemStatement?: string | null;
  targetMarket?: string | null;
  workspaceStage?: string | null;
  progressPercent?: number;
  founder?: { id: string; name: string; email: string } | null;
  members?: { userId: string; name: string; email: string; role: string }[];
  access: 'full' | 'team' | 'investor';
}

export interface WorkspaceUpdateBody {
  projectName?: string;
  tagline?: string;
  problemStatement?: string;
  targetMarket?: string;
  workspaceStage?: 'Idea' | 'Validation' | 'Building' | 'Growth';
}

export interface IdeaVaultItem {
  id: string;
  projectId: string;
  type: 'note' | 'pitch_draft';
  title: string;
  content: string;
  status: 'draft' | 'submitted_for_review';
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceBusinessModel {
  id: string;
  projectId: string;
  valueProposition?: string | null;
  customerSegments?: string | null;
  revenueStreams?: string | null;
  costStructure?: string | null;
  channels?: string | null;
  keyActivities?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkspaceTeamMember {
  id: string;
  userId: string;
  role: string;
  name: string;
  email: string;
}

export interface WorkspaceFile {
  id: string;
  projectId: string;
  fileName?: string;
  fileUrl: string;
  category?: string | null;
  uploadedBy?: { id: string; name: string };
  createdAt: string;
}

export interface WorkspaceInvestorView {
  id: string;
  projectName: string;
  tagline?: string | null;
  description?: string | null;
  problemStatement?: string | null;
  targetMarket?: string | null;
  workspaceStage?: string | null;
  progressPercent?: number;
  founderName?: string | null;
  startupProfile?: unknown;
}

export interface WorkspaceProgress {
  progressPercent: number;
  workspaceStage: string;
  status?: string;
  tasksCompleted: number;
  tasksTotal: number;
  milestonesCompleted: number;
  milestonesTotal: number;
}

export interface DealRoomStartup {
  id: string;
  projectId: string;
  pitchSummary: string;
  tractionMetrics?: string | null;
  fundingNeeded: number;
  equityOffer?: number | null;
  stage: string;
  visibilityStatus: string;
  investorReady: boolean;
  project?: {
    id: string;
    projectName: string;
    stage: string;
    description?: string | null;
    problemStatement?: string | null;
    targetMarket?: string | null;
    workspaceStage?: string | null;
    client?: { businessName: string; industry?: string | null };
  };
}

export interface DealRoomStartupDetail extends DealRoomStartup {
  project?: DealRoomStartup['project'] & {
    client?: { businessName: string; industry?: string | null; userId: string; user?: { name: string; email: string } };
    milestones?: { id: string; title: string; status: string; dueDate: string | null }[];
    files?: { id: string; fileUrl: string; category?: string | null }[];
    businessModel?: { valueProposition?: string | null; customerSegments?: string | null; revenueStreams?: string | null; costStructure?: string | null; channels?: string | null; keyActivities?: string | null } | null;
  };
}

export interface DealRoomAccessItem {
  id: string;
  status: 'requested' | 'approved' | 'rejected';
  createdAt: string;
  decidedAt: string | null;
  investor: { id: string; name: string; email: string };
}

export interface CompanyEquityRow {
  id: string;
  personName: string;
  role: string;
  shares: number;
  equityPercent: number;
  vestingStart: string | null;
  vestingYears: number;
  createdAt: string;
  updatedAt: string;
}

export interface StartupEquityRow {
  id: string;
  startupId: string;
  personName: string;
  role: string;
  shares: number | null;
  equityPercent: number;
  vestingStart: string | null;
  vestingYears: number;
  createdAt: string;
  updatedAt: string;
}

export interface DealRoomMessage {
  id: string;
  investmentId: string;
  senderId: string;
  message: string;
  createdAt: string;
  sender?: { id: string; name: string; email: string };
}

export interface DealRoomAdminDeal {
  id: string;
  startupId: string;
  startupName?: string;
  investorId: string;
  investorName: string;
  investorEmail: string;
  firmName?: string | null;
  status: string;
  interestLevel: string;
  viewedAt: string | null;
  meetingRequestedAt?: string | null;
  amount?: number | null;
  equityPercent?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  status: 'Pending' | 'InProgress' | 'Completed';
  dueDate: string | null;
  tasks?: Task[];
}

export interface Task {
  id: string;
  projectId: string;
  milestoneId?: string | null;
  title: string;
  description: string | null;
  status: string;
  priority?: 'Low' | 'Medium' | 'High';
  dueDate: string | null;
  assignedTo?: { id: string; name: string; email: string } | null;
  milestone?: { id: string; title: string; status?: string } | null;
}

export interface TaskWithProject extends Task {
  project?: { id: string; projectName: string };
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
  isHighlighted: boolean;
}

export interface UserBadge {
  badgeName: string;
  dateAwarded: string;
}

export interface FounderReputationBreakdown {
  profileCompleteness: number;
  ideaClarity: number;
  projectProgress: number;
  communicationResponsiveness: number;
  meetingAttendance: number;
  teamFeedback: number;
  investorFeedback: number;
  milestonesAchieved: number;
  total: number;
  level: 'Beginner' | 'Builder' | 'Trusted Founder' | 'Elite Founder';
}

export interface SocialMediaLink {
  id: string;
  platformName: string;
  url: string;
  iconUrl?: string | null;
  active: boolean;
  clickCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SocialShareMeta {
  id: string;
  pageName: string;
  title: string;
  description: string;
  imageUrl: string;
  canonicalUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ForumPost {
  id: string;
  userId: string;
  title: string;
  body: string;
  category: string;
  isPinned: boolean;
  isLocked: boolean;
  isDeleted: boolean;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; role: string };
}

export interface ForumComment {
  id: string;
  postId: string;
  userId: string;
  body: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; role: string };
}

export interface PaymentRow {
  id: string;
  projectId: string;
  amount: number;
  status: string;
  dueDate: string | null;
  createdAt: string;
}

export interface AIEvaluateIdeaResponse {
  feasibilityScore: number;
  riskLevel: string;
  marketPotential: string;
  suggestedMvpScope: string[];
  summary: string;
}

export interface AIGenerateProposalResponse {
  projectScope: string[];
  timelineWeeks: number;
  techStack: Record<string, string>;
  estimatedCostUsd: number;
  estimatedCostNgn?: number;
  estimatedCostEur?: number;
  estimatedCostGbp?: number;
  currency: string;
  summary: string;
}

export interface AIPricingResponse {
  amountUsd: number;
  conversions: Record<string, number>;
  regionAdjustment: number;
  summary: string;
}

export interface AIProjectInsightsResponse {
  predictedDelays: string[];
  riskAreas: string[];
  suggestions: string[];
  overallHealth: string;
  summary: string;
}

export interface AIMarketingSuggestionsResponse {
  suggestions: string[];
  summary: string;
}

export interface AIStartupCofounderResponse {
  idealCofounderProfile: string[];
  roleFit: { yourRole: string; suggestedComplement: string };
  traitsToLookFor: string[];
  redFlags: string[];
  summary: string;
}

export interface AIBusinessPlanResponse {
  executiveSummary: string;
  problemStatement: string;
  solution: string;
  marketOpportunity: { size: string; trends: string[] };
  businessModel: { revenue: string; pricing: string; unitEconomics: string };
  goToMarket: string[];
  financialProjections: { year1: string; year2: string; year3: string };
  summary: string;
}

export interface AIMarketAnalysisResponse {
  marketSize: { tam: string; sam: string; som: string };
  trends: string[];
  competitors: string[];
  opportunities: string[];
  threats: string[];
  summary: string;
}

export interface AIRiskAnalysisResponse {
  risks: { area: string; level: string; description: string; mitigation: string }[];
  investorReadinessScore: number;
  scoreBreakdown: Record<string, number>;
  nextSteps: string[];
  summary: string;
}

export interface AIIdeaChatResponse {
  message: string;
}

export interface AISmartMilestonesResponse {
  milestones: { title: string; suggestedWeeks: number; phase: string; order: number; dueOffsetWeeks: number }[];
  horizonWeeks: number;
  summary: string;
}

export interface Tenant {
  id: string;
  orgName: string;
  domain: string | null;
  logo: string | null;
  primaryColor: string | null;
  planType: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TenantRow extends Tenant {
  userCount?: number;
  createdAt: string;
}

export interface TenantBillingRow {
  id: string;
  tenantId: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  status: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  projectId: string;
  platform: string;
  budget: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  campaignId: string;
  source: string;
  cost: number;
  conversionStatus: string;
  createdAt: string;
}

export interface CampaignWithLeads extends Campaign {
  leads: Lead[];
}

export interface MarketingAnalytics {
  projectId: string;
  traffic: number;
  conversions: number;
  cac: number | null;
  roi: number | null;
  totalCost: number;
  byPlatform: Record<string, { traffic: number; conversions: number; cost: number }>;
  funnel: { stage: string; count: number }[];
  snapshot: {
    traffic: number;
    conversions: number;
    cac: number | null;
    roi: number | null;
    periodStart: string;
    periodEnd: string;
  } | null;
}

export type AdminLeadStatus = 'New' | 'Contacted' | 'ProposalSent' | 'Converted' | 'Closed';

export interface AdminLeadRow {
  id: string;
  name: string;
  email: string;
  country: string | null;
  ideaSummary: string | null;
  stage: string | null;
  goal: string | null;
  budget: string | null;
  status: AdminLeadStatus;
  assignedToId: string | null;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo?: { id: string; name: string; email: string } | null;
  project?: { id: string; projectName: string } | null;
}

export interface AdminLeadDetail extends AdminLeadRow {
  notes: AdminLeadNoteRow[];
}

export interface AdminLeadNoteRow {
  id: string;
  adminLeadId: string;
  content: string;
  createdById: string | null;
  createdAt: string;
  createdBy?: { id: string; name: string } | null;
}
