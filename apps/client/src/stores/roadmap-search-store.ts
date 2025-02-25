import { z } from 'zod';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const numberFilterSchema = z.object({
  operator: z.enum(['gt', 'lt', 'equals', 'not_equals']).optional(),
  value: z.coerce.number().optional(),
});

export const filterRoadmapItemsSchema = z.object({
  groupBy: z.enum(['board', 'category', 'owner', 'status']).optional(),
  board: z.union([z.array(z.string()), z.string()]).optional(),
  category: z.union([z.array(z.string()), z.string()]).optional(),
  tags: z.union([z.array(z.string()), z.string()]).optional(),
  impact: numberFilterSchema.optional(),
  effort: numberFilterSchema.optional(),
  votes: numberFilterSchema.optional(),
  status: z.union([z.array(z.string()), z.string()]).optional(),
  owner: z.union([z.array(z.string()), z.string()]).optional(),
  eta_start: z.string().optional(),
  eta_end: z.string().optional(),
  search: z.string().optional()
});

export type RoadmapSearchParams = z.infer<typeof filterRoadmapItemsSchema>;

interface RoadmapSearchStore {
  searchParams: RoadmapSearchParams;
  setSearchParams: (params: Partial<RoadmapSearchParams>) => void;
  resetSearchParams: () => void;
}

export const useRoadmapSearchStore = create<RoadmapSearchStore>()(
  persist(
    (set) => ({
      searchParams: {},
      setSearchParams: (params) => set((state) => ({
        searchParams: {  ...params }
      })),
      resetSearchParams: () => set({ searchParams: {} }),
    }),
    {
      name: 'roadmap-search-store',
    }
  )
); 