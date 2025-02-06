import { Link } from "@tanstack/react-router"
import { Icons } from "../icons"

export const PublicButton = () => {
  return (
    <Link to="/" className="button button-small button-primary aspect-square size-8">
      <Icons.Eye size={16} />
    </Link>
  )
}