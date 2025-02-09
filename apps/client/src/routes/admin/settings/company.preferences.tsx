import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/settings/company/preferences')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className='vertical gap-2'>
      Preferences
    </div>
  )
}
