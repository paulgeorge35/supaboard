import { useLocation, useParams, useRouter } from "@tanstack/react-router";
import { Button } from "../button";
import { Icons } from "../icons";

export const PublicButton = () => {
  const location = useLocation();
  const router = useRouter()
  const { boardSlug, feedbackSlug, changelogSlug } = useParams({ strict: false })

  let path = '/';

  if (boardSlug) {
    path = `/${boardSlug}`
    if (feedbackSlug) {
      path = `/${boardSlug}/${feedbackSlug}`
    }
  }

  if (location.pathname.startsWith('/admin/changelog')) {
    path = '/changelog'
    if (changelogSlug) {
      path = `/changelog/${changelogSlug}`
    }
  }

  const handleClick = () => {
    router.navigate({ to: path })
  }

  return (
    <Button size='icon' variant='outline' onClick={handleClick}>
      <Icons.Eye size={16} className="!stroke-gray-500 dark:!stroke-zinc-400" />
    </Button>
  )
}