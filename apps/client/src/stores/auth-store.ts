import type { ApplicationSummary, BoardSummary, Role, User, Workspace } from '@repo/database'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface AuthState {
    user?: Pick<User, 'id' | 'email' | 'name' | 'avatar'>
    application?: ApplicationSummary & {
        boards: BoardSummary[]
        hasChangelog: boolean
        role: Role | null
    }
    workspaces?: Workspace[]
    setUser: (user?: AuthState['user']) => void
    setApplication: (application: AuthState['application']) => void
    setWorkspaces: (workspaces: AuthState['workspaces']) => void
}

const initialState: Omit<AuthState, 'setUser' | 'setApplication' | 'setWorkspaces'> = {
    user: undefined,
    application: undefined,
    workspaces: undefined,
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            ...initialState,
            setUser: (user) => set({ user }),
            setApplication: (application) => set({ application }),
            setWorkspaces: (workspaces) => set({ workspaces }),
        }),
        {
            name: 'auth-store',
            storage: createJSONStorage(() => sessionStorage)
        }
    )
) 