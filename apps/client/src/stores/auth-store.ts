import type { ApplicationSummary, BoardSummary, User, Workspace } from '@repo/database'
import { create } from 'zustand'

interface AuthState {
    user?: Pick<User, 'id' | 'email' | 'name' | 'avatar'>
    application?: ApplicationSummary & {
        boards: BoardSummary[]
        hasChangelog: boolean
    }
    workspaces?: Workspace[]
    setUser: (user?: AuthState['user']) => void
    setApplication: (application: AuthState['application']) => void
    setWorkspaces: (workspaces: AuthState['workspaces']) => void
}

export const useAuthStore = create<AuthState>((set) => ({
    user: undefined,
    application: undefined,
    workspaces: undefined,
    setUser: (user) => set({ user }),
    setApplication: (application) => set({ application }),
    setWorkspaces: (workspaces) => set({ workspaces }),
})) 