import AnimatedOutlet from '@/components/animated-outlet';
import { RoadmapTable } from '@/components/roadmap-table';
import { roadmapQuery } from '@/lib/query';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useMatch, useMatches, useParams } from '@tanstack/react-router';
import { AnimatePresence } from 'framer-motion';

export const Route = createFileRoute('/admin/roadmap/$roadmapSlug')({
  component: RouteComponent,
});

function RouteComponent() {
  const { roadmapSlug } = useParams({ from: Route.fullPath });

  const { data: roadmap, isLoading } = useQuery(
    roadmapQuery(roadmapSlug)
  );
  const matches = useMatches();
  const match = useMatch({ strict: false });
  const nextMatchIndex = matches.findIndex((d) => d.id === match.id) + 1;
  const nextMatch = matches[nextMatchIndex];

  return (
    <div className='vertical h-full'>
      <RoadmapTable items={isLoading ? undefined : roadmap?.items} />
      <AnimatePresence mode="popLayout">
        <AnimatedOutlet key={nextMatch?.id}
          transitionProps={nextMatch?.routeId === '/admin/roadmap/$roadmapSlug/filter' ? {
            transition: {
              duration: 0.1,
              ease: 'easeInOut',
            },
            initial: { top: 0, right: '-100%', bottom: 0, position: 'absolute', zIndex: 30 },
            animate: { right: 0, zIndex: 30 },
            exit: { right: '-100%', transition: { duration: 0.3, ease: 'easeInOut' } },
          } : {
            transition: {
              duration: 0.1,
              ease: 'easeInOut',
            },
          }} />
      </AnimatePresence>
    </div>
  );
}
