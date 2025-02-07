import type { ApplicationSummary, BoardSummary, User } from '@repo/database'
import { create } from 'zustand'

interface AuthState {
    user?: Pick<User, 'id' | 'email' | 'name' | 'avatar'>
    application?: ApplicationSummary & {
        boards: BoardSummary[]
    }
    setUser: (user?: AuthState['user']) => void
    setApplication: (application: AuthState['application']) => void
}

export const useAuthStore = create<AuthState>((set) => ({
    user: undefined,
    application: undefined,
    setUser: (user) => set({ user }),
    setApplication: (application) => set({ application }),
})) 