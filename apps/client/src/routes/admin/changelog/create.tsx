import { Button, LoadingSpinner } from '@/components'
import { ChangelogContent } from '@/components/admin/changelog/changelog-renderer'
import { Controls } from '@/components/admin/changelog/controls'
import { ChangelogEditor } from '@/components/admin/changelog/editor'
import { useCreateChangelogMutation } from '@/lib/mutation'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/admin/changelog/create')({
  component: RouteComponent,
})

function RouteComponent() {
  const [changelogData, setChangelogData] = useState<{
    title: string
    description: string,
    tags: ('NEW' | 'IMPROVED' | 'FIXED')[]
    labels: {
      id: string
      name: string
    }[]
  }>({
    title: '',
    description: '',
    tags: [],
    labels: [],
  })
  const { mutate: createChangelog, isPending } = useCreateChangelogMutation();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (changelogData.title === '') return;
      createChangelog({
        title: changelogData.title,
        description: changelogData.description,
        tags: changelogData.tags,
        labelIds: changelogData.labels.map(label => label.id),
      })
    }, 500);

    return () => clearTimeout(timer);
  }, [changelogData, createChangelog]);

  return (
    <div className="pt-18 grid grid-cols-[minmax(200px,250px)_1fr_1fr] w-full h-full max-h-full">
      <div className="col-span-1 vertical gap-2 overflow-y-auto h-full sticky left-0">
        <div className="vertical">
          <Controls
            types={changelogData.tags}
            onTypeChange={(value) => setChangelogData({ ...changelogData, tags: value })}
            labels={changelogData.labels}
            onLabelChange={(value) => setChangelogData({ ...changelogData, labels: value })}
          />
        </div>
      </div>
      <div className='vertical border-l min-w-[400px] p-8 bg-white dark:bg-zinc-900 z-10' style={{ transform: 'translate3d(0, 0, 0)' }}>
        <ChangelogContent changelog={changelogData} status='DRAFT' publishedAt={null} />
      </div>
      <div className='vertical border-l min-w-[400px]'>
        <ChangelogEditor
          title={changelogData.title}
          onChangeTitle={(value) => setChangelogData({ ...changelogData, title: value })}
          content={changelogData.description}
          onChangeContent={(value) => setChangelogData({ ...changelogData, description: value })}
        />
        <div className='horizontal center-v gap-2 p-4 border-t'>
          {isPending && <span className='horizontal center-v gap-2 text-sm text-gray-500 dark:text-zinc-500'>
            <LoadingSpinner className='stroke-zinc-500 dark:stroke-zinc-400' />
            Saving draft...
          </span>}
          <Button
            disabled
            className='ml-auto'
          >
            Publish
          </Button>
        </div>
      </div>
    </div>
  )
}
