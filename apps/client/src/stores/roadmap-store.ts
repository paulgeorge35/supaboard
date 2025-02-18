import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type RoadmapField = 'title' | 'estimatedDelivery' | 'owner' | 'category' | 'status' | 'tags' | 'board' | 'impact' | 'votes' | 'effort' | 'score';

const DEFAULT_VISIBLE_FIELDS: RoadmapField[] = ['title', 'estimatedDelivery', 'owner', 'category', 'status', 'tags', 'board', 'impact', 'votes', 'effort', 'score'];

interface RoadmapStore {
  visibleFields: RoadmapField[];
  setVisibleFields: (fields: RoadmapField[]) => void;
  resetVisibleFields: () => void;
  isField: (field: string) => boolean;
}

export const useRoadmapStore = create<RoadmapStore>()(
  persist(
    (set) => ({
      visibleFields: DEFAULT_VISIBLE_FIELDS,
      setVisibleFields: (fields) => set({ visibleFields: fields }),
      resetVisibleFields: () => set({ visibleFields: DEFAULT_VISIBLE_FIELDS }),
      isField: (field: string) => DEFAULT_VISIBLE_FIELDS.includes(field as RoadmapField),
    }),
    {
      name: 'roadmap-store',
    }
  )
) 