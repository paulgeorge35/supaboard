import type { Application, Board, User } from '@repo/database'
import { create } from 'zustand'

interface AuthState {
    user?: Pick<User, 'id' | 'email' | 'name' | 'avatar'>
    application?: Pick<Application, 'id' | 'name' | 'subdomain' | 'customDomain' | 'domainStatus' | 'logoUrl' | 'iconUrl' | 'color' | 'preferredTheme' | 'preferredLanguage' | 'ownerId'> & {
        boards: Pick<Board, 'id' | 'name' | 'slug'>[]
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