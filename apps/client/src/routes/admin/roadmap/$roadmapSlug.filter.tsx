import { createFileRoute, useParams, useRouter, useSearch } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';

export const Route = createFileRoute('/admin/roadmap/$roadmapSlug/filter')({
  component: RouteComponent,
})

function RouteComponent() {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { roadmapSlug } = useParams({ from: Route.fullPath });
  const search = useSearch({ from: Route.fullPath });
  const filterButton = document.getElementById('filter-button');
  const handleClickOutside = (e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node) && !filterButton?.contains(e.target as Node)) {
      router.navigate({ to: '/admin/roadmap/$roadmapSlug', params: { roadmapSlug }, search });
    }
  }

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    }
  }, [handleClickOutside]);

  return (
    <div ref={ref} className='z-50 h-full w-86 bg-white dark:bg-zinc-900 border-l shadow-lg'>
      <div className='p-4'>
        <h1 className='text-2xl font-bold'>Filters</h1>
      </div>
    </div>
  )
}
