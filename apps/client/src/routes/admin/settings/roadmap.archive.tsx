import { Button, Icons, Tooltip } from '@/components'
import { ModalComponent } from '@/components/modal-component'
import { useArchiveRoadmapMutation, useDeleteRoadmapMutation, useRestoreRoadmapMutation } from '@/lib/mutation/roadmap'
import { archivedRoadmapsQuery, roadmapsQuery } from '@/lib/query/roadmap'
import { cn } from '@/lib/utils'
import { useBoolean } from '@paulgeorge35/hooks'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/settings/roadmap/archive')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className='vertical gap-2 w-full md:min-w-[600px]'>
      <h1 className='font-medium'>Roadmaps</h1>
      <p className='text-sm text-gray-500 dark:text-zinc-400'>Archive, unarchive, or delete your roadmaps permanently.</p>
      <div className='vertical gap-2'>
        <ArchivedRoadmaps />
        <ActiveRoadmaps />
      </div>
    </div>
  )
}

function ArchivedRoadmaps() {
  const expanded = useBoolean(false);
  const confimationModal = useBoolean(false);
  const { data } = useQuery(archivedRoadmapsQuery)
  const { mutate: restoreRoadmap, isPending: isRestoringRoadmap } = useRestoreRoadmapMutation()
  const { mutate: deleteRoadmap, isPending: isDeletingRoadmap } = useDeleteRoadmapMutation({ onSuccess: () => confimationModal.setFalse() })

  return (
    <div className='vertical'>
      <button className='w-full horizontal center-v space-between py-2 cursor-pointer' onClick={expanded.toggle}>
        <h1 className={cn('text-sm font-medium',
          { 'text-gray-500 dark:text-zinc-400': !expanded.value }
        )}>
          Archived ({data?.length})
        </h1>
        <Icons.ChevronUp className={cn('size-4 transition-transform duration-150',
          { 'rotate-180': expanded.value }
        )} />
      </button>

      {expanded.value && data && data.length > 0 && (
        <div className='vertical gap-2 mt-2'>
          {data?.map(roadmap => (
            <div key={roadmap.id} className='horizontal center-v space-between border rounded-lg px-3 py-2'>
              <p className='text-sm text-light'>
                {roadmap.name} ({roadmap._count.items})
              </p>
              <span className='horizontal center-v gap-1'>
                <Tooltip content='Restore' side='left' className='whitespace-pre-wrap text-center'>
                  <span>
                    <Button size='icon' variant='ghost' color='secondary' onClick={() => restoreRoadmap(roadmap.slug)}>
                      <Icons.ArchiveRestore className='size-4' />
                    </Button>
                  </span>
                </Tooltip>
                <div className='h-4 border-r' />
                <Tooltip content='Delete' side='left' className='whitespace-pre-wrap text-center'>
                  <span>
                    <Button size='icon' variant='ghost' color='secondary' onClick={() => deleteRoadmap(roadmap.slug)}>
                      <Icons.Trash className='size-4' />
                    </Button>
                  </span>
                </Tooltip>
              </span>
              <ModalComponent isOpen={confimationModal.value} onClose={confimationModal.setFalse}>
                <div className='vertical gap-2'>
                  <h1 className='text-lg font-medium'>Delete roadmap</h1>
                  <p className='text-sm text-gray-500 dark:text-zinc-400'>
                    Are you sure you want to delete this roadmap?
                  </p>
                  <div className='horizontal justify-end gap-2'>
                    <Button disabled={isRestoringRoadmap || isDeletingRoadmap} variant='outline' color='secondary' size='sm' onClick={confimationModal.setFalse}>Cancel</Button>
                    <Button isLoading={isRestoringRoadmap || isDeletingRoadmap} color='primary' size='sm' onClick={() => deleteRoadmap(roadmap.slug)}>Delete</Button>
                  </div>
                </div>
              </ModalComponent>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ActiveRoadmaps() {
  const expanded = useBoolean(true);
  const confimationModal = useBoolean(false);
  const { data } = useQuery(roadmapsQuery)

  const { mutate: archiveRoadmap, isPending: isArchivingRoadmap } = useArchiveRoadmapMutation()
  const { mutate: deleteRoadmap, isPending: isDeletingRoadmap } = useDeleteRoadmapMutation({ onSuccess: () => confimationModal.setFalse() })

  return (
    <div className='vertical'>
      <button className='w-full horizontal center-v space-between py-2 cursor-pointer' onClick={expanded.toggle}>
        <h1 className={cn('text-sm font-medium',
          { 'text-gray-500 dark:text-zinc-400': !expanded.value }
        )}>
          Active ({data?.length})
        </h1>
        <Icons.ChevronUp className={cn('size-4 transition-transform duration-150',
          { 'rotate-180': expanded.value }
        )} />
      </button>

      {expanded.value && data && data.length > 0 && (
        <div className='vertical gap-2 mt-2'>
          {data?.map(roadmap => (
            <div key={roadmap.id} className='horizontal center-v space-between border rounded-lg px-3 py-2'>
              <p className='text-sm text-light'>
                {roadmap.name} ({roadmap._count.items})
              </p>
              <span className='horizontal center-v gap-1'>
                <Tooltip content={data.length === 1 ? "You can't archive \nthe only active roadmap." : "Archive"} side='left' className='whitespace-pre-wrap text-center'>
                  <span>
                    <Button size='icon' variant='ghost' disabled={data.length === 1} color='secondary' onClick={() => archiveRoadmap(roadmap.slug)}>
                      <Icons.Archive className='size-4' />
                    </Button>
                  </span>
                </Tooltip>
                <div className='h-4 border-r' />
                <Tooltip content={data.length === 1 ? "You can't delete \nthe only active roadmap." : "Delete"} side='left' className='whitespace-pre-wrap text-center'>
                  <span>
                    <Button size='icon' variant='ghost' disabled={data.length === 1} color='secondary' onClick={confimationModal.setTrue}>
                      <Icons.Trash className='size-4' />
                    </Button>
                  </span>
                </Tooltip>
              </span>
              <ModalComponent isOpen={confimationModal.value} onClose={confimationModal.setFalse}>
                <div className='vertical gap-2'>
                  <h1 className='text-lg font-medium'>Delete roadmap</h1>
                  <p className='text-sm text-gray-500 dark:text-zinc-400'>
                    Are you sure you want to delete this roadmap?
                  </p>
                  <div className='horizontal justify-end gap-2'>
                    <Button disabled={isArchivingRoadmap || isDeletingRoadmap} variant='outline' color='secondary' size='sm' onClick={confimationModal.setFalse}>Cancel</Button>
                    <Button isLoading={isArchivingRoadmap || isDeletingRoadmap} color='primary' size='sm' onClick={() => deleteRoadmap(roadmap.slug)}>Delete</Button>
                  </div>
                </div>
              </ModalComponent>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}