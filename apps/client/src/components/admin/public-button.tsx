import { useParams, useRouter } from "@tanstack/react-router"
import { Button } from "../button"
import { Icons } from "../icons"

export const PublicButton = () => {
  const router = useRouter()
  const { boardSlug, feedbackSlug } = useParams({ strict: false })
  const path = boardSlug && feedbackSlug ? `/${boardSlug}/${feedbackSlug}` : boardSlug ? `/${boardSlug}` : '/'

  const handleClick = () => {
    router.navigate({ to: path })
  }

  return (
    <Button size='icon' variant='outline' onClick={handleClick}>
      <Icons.Eye size={16} className="!stroke-gray-500 dark:!stroke-zinc-400" />
    </Button>
  )
}