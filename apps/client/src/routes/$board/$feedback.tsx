import { createFileRoute, useParams } from '@tanstack/react-router'

export const Route = createFileRoute('/$board/$feedback')({
  component: RouteComponent,
})

function RouteComponent() {
  const { board, feedback } = useParams({ from: '/$board/$feedback' })
  return <div>Hello "{board}" and "{feedback}"!</div>
}
