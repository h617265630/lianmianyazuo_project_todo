import type {
  Project,
  ProjectStatus,
  ProjectPhase,
  Todo,
  TodoStatus,
  TodoDifficulty,
  TodoHorizon,
  ResearchNote,
  ResearchStage,
  ResourceItem,
  Insight,
  InsightKind,
  User,
  ProjectView,
  Bucket,
} from '@/types'
import { http } from './client'

export type TodoInput = Omit<
  Todo,
  'id' | 'createdAt' | 'status' | 'difficulty' | 'parentId' | 'horizon'
> & {
  status?: TodoStatus
  difficulty?: TodoDifficulty
  parentId?: string
  horizon?: TodoHorizon
}
export type TodoPatch = Omit<Partial<Todo>, 'projectId' | 'dueDate' | 'parentId' | 'startDate'> & {
  projectId?: string | null
  dueDate?: string | null
  startDate?: string | null
  parentId?: string | null
}
export type ResourceInput = Omit<ResourceItem, 'id' | 'addedAt' | 'status'> & {
  status?: ResourceItem['status']
}
export type ResearchInput = Omit<ResearchNote, 'id' | 'createdAt' | 'updatedAt' | 'stage'> & {
  stage?: ResearchStage
}
export type InsightInput = Omit<Insight, 'id' | 'createdAt'> & {
  kind: InsightKind
}

export type AuthResponse = { token: string; user: User }

export const api = {
  health: () => http.get<{ ok: boolean }>('/api/health'),

  // auth
  register: (input: { email: string; name: string; password: string }) =>
    http.post<AuthResponse>('/api/auth/register', input),
  login: (input: { email: string; password: string }) =>
    http.post<AuthResponse>('/api/auth/login', input),
  me: () => http.get<User>('/api/auth/me'),
  updateMe: (input: { name?: string; email?: string }) => http.patch<User>('/api/auth/me', input),

  // projects
  listProjects: () => http.get<Project[]>('/api/projects'),
  getProject: (id: string) => http.get<Project>(`/api/projects/${id}`),
  createProject: (input: {
    name: string; tagline: string; description: string; startDate: string; localPath: string
    status?: string; phase?: string; progress?: number; repoUrl?: string; liveUrl?: string
  }) => http.post<Project>('/api/projects', input),
  updateProject: (
    id: string,
    patch: { status?: ProjectStatus; phase?: ProjectPhase; progress?: number },
  ) => http.patch<Project>(`/api/projects/${id}`, patch),
  addCheckin: (id: string, note: string) =>
    http.post<Project>(`/api/projects/${id}/checkins`, { note }),
  addObjective: (projectId: string, title: string) =>
    http.post<Project>(`/api/projects/${projectId}/objectives`, { title }),
  addKeyResult: (objectiveId: string, input: { title: string; progress?: number }) =>
    http.post<{ ok: boolean }>(`/api/projects/objectives/${objectiveId}/key-results`, input),
  updateKeyResult: (id: string, patch: { title?: string; progress?: number }) =>
    http.patch<{ ok: boolean }>(`/api/projects/key-results/${id}`, patch),
  deleteObjective: (id: string) => http.del<void>(`/api/projects/objectives/${id}`),
  reset: () => http.post<{ ok: boolean }>('/api/reset'),

  // project views & kanban buckets
  getProjectViews: (projectId: string) =>
    http.get<ProjectView[]>(`/api/projects/${projectId}/views`),
  createProjectView: (projectId: string, input: { title?: string; viewKind?: number; bucketConfigMode?: number; initialBuckets?: { title: string; limit?: number; position?: number }[] }) =>
    http.post<ProjectView>(`/api/projects/${projectId}/views`, input),
  updateProjectView: (viewId: string, patch: Partial<ProjectView>) =>
    http.patch<ProjectView>(`/api/projects/views/${viewId}`, patch),
  deleteProjectView: (viewId: string) =>
    http.del<void>(`/api/projects/views/${viewId}`),
  createBucket: (viewId: string, input: { title: string; limit?: number; position?: number }) =>
    http.post<Bucket>(`/api/projects/views/${viewId}/buckets`, input),
  updateBucket: (viewId: string, bucketId: string, patch: { title?: string; limit?: number; position?: number }) =>
    http.patch<Bucket>(`/api/projects/views/${viewId}/buckets/${bucketId}`, patch),
  deleteBucket: (viewId: string, bucketId: string) =>
    http.del<void>(`/api/projects/views/${viewId}/buckets/${bucketId}`),

  // todos
  listTodos: () => http.get<Todo[]>('/api/todos'),
  listOpenTodos: () => http.get<Todo[]>('/api/todos/open'),
  listDoneTodos: () => http.get<Todo[]>('/api/todos/done'),
  createPublicTodo: (input: { userId: string; title: string; priority?: string; difficulty?: string; horizon?: TodoHorizon; startDate?: string; dueDate?: string; projectId?: string; tomatoMinutes?: number }) =>
    http.post<Todo>('/api/todos/public', input),
  createTodo: (input: TodoInput) => http.post<Todo>('/api/todos', input),
  updateTodo: (id: string, patch: TodoPatch) => http.patch<Todo>(`/api/todos/${id}`, patch),
  deleteTodo: (id: string) => http.del<void>(`/api/todos/${id}`),

  // research
  listResearch: () => http.get<ResearchNote[]>('/api/research'),
  getResearch: (id: string) => http.get<ResearchNote>(`/api/research/${id}`),
  createResearch: (input: ResearchInput) => http.post<ResearchNote>('/api/research', input),
  updateResearch: (id: string, patch: Partial<ResearchNote>) =>
    http.patch<ResearchNote>(`/api/research/${id}`, patch),
  deleteResearch: (id: string) => http.del<void>(`/api/research/${id}`),

  // resources
  listResources: () => http.get<ResourceItem[]>('/api/resources'),
  createResource: (input: ResourceInput) => http.post<ResourceItem>('/api/resources', input),
  updateResource: (id: string, patch: Partial<ResourceItem>) =>
    http.patch<ResourceItem>(`/api/resources/${id}`, patch),
  deleteResource: (id: string) => http.del<void>(`/api/resources/${id}`),

  // insights（方法 / 感悟）
  listInsights: () => http.get<Insight[]>('/api/insights'),
  createInsight: (input: InsightInput) => http.post<Insight>('/api/insights', input),
  updateInsight: (id: string, patch: Partial<Insight>) =>
    http.patch<Insight>(`/api/insights/${id}`, patch),
  deleteInsight: (id: string) => http.del<void>(`/api/insights/${id}`),
}
