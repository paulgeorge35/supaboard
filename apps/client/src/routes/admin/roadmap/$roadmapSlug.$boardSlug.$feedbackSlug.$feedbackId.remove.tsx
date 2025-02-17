import { ModalComponent } from '@/components/modal-component'
import { useRemoveFromRoadmapMutation } from '@/lib/mutation/roadmap'
import { createFileRoute, useParams, useRouter } from '@tanstack/react-router'
import { Button } from 'react-aria-components'

export const Route = createFileRoute('/admin/roadmap/$roadmapSlug/$boardSlug/$feedbackSlug/$feedbackId/remove')(
  {
    component: RouteComponent,
  },
)

function RouteComponent() {
  const router = useRouter()
  const { roadmapSlug, boardSlug, feedbackSlug, feedbackId } = useParams({ from: Route.fullPath })
  const { mutate: removeFromRoadmap, isPending: isRemovingFromRoadmap } =
    useRemoveFromRoadmapMutation(roadmapSlug)

  const onClose = () => {
    router.navigate({
      to: '/admin/roadmap/$roadmapSlug',
      params: { roadmapSlug },
    })
  }

  return (
    <ModalComponent isOpen={true} onClose={onClose} aria-label="Rename Roadmap">
      <p className="text-gray-500">
        Are you sure you want to remove this feedback from the roadmap?
      </p>
      <div className="horizontal gap-4 center-v mt-4 w-full justify-end">
        <Button
          onPress={onClose}
          className="border text-sm rounded-md px-2 py-1 font-light text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-100"
        >
          Cancel
        </Button>
        <Button
          onPress={() => removeFromRoadmap({ feedbackId, feedbackSlug, boardSlug })}
          isDisabled={isRemovingFromRoadmap}
          className="rounded-md text-sm px-2 py-1 bg-[var(--color-primary)] text-zinc-100 hover:bg-[var(--color-primary)]/80 transition-colors duration-100 font-light disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Remove
        </Button>
      </div>
    </ModalComponent>
  )
}
