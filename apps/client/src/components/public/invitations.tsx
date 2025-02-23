import { useRespondInvitationMutation } from "@/lib/mutation"
import { invitationQuery } from "@/lib/query"
import { ROLE_OPTIONS } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"
import { useQuery } from "@tanstack/react-query"
import { Avatar } from "../avatar"
import { Button } from "../button"
import { Icons } from "../icons"
import { ImageComponent } from "../image"

export const Invitation = () => {
    const { application } = useAuthStore()
    const { data } = useQuery(invitationQuery)
    const { mutate: respondInvitation, isPending } = useRespondInvitationMutation();

    if (!data) return null;

    return (
        <div className="border border-[var(--color-primary)] bg-[var(--color-primary)]/10 rounded-lg p-4 vertical gap-2">
            <span className="text-sm text-[var(--color-primary)] inline-flex flex-wrap items-center gap-1">
                You've been invited by
                <span className="font-bold px-1 py-0.5 bg-[var(--color-primary)]/10 rounded-md text-[var(--color-primary)] inline-flex items-center gap-1">
                    {data.invitedBy.avatar && <Avatar src={data.invitedBy.avatar} name={data.invitedBy.name} width={16} className="size-4" />}
                    {data.invitedBy.name}
                </span>
                to join
                <span className="font-bold px-1 py-0.5 bg-[var(--color-primary)]/10 rounded-md text-[var(--color-primary)] inline-flex items-center gap-1">
                    {application?.logo && <ImageComponent src={application?.logo} alt={application?.name} className="size-4" />}
                    {application?.name}
                </span>
                team as a
                <span className="text-[var(--color-primary)]">{ROLE_OPTIONS.find(role => role.value === data.role)?.label}</span>
                <Button
                    disabled={isPending}
                    size="sm"
                    variant="outline"
                    className="hidden md:flex ml-auto text-[var(--color-primary)] dark:text-[var(--color-primary)] border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 dark:hover:!bg-[var(--color-primary)]/10"
                    onClick={() => respondInvitation({ inviteId: data.id, accept: true })}
                >
                    Join {application?.name}
                </Button>
                <Button
                    disabled={isPending}
                    size="sm"
                    variant="outline"
                    className="hidden md:flex ml-1 aspect-square text-[var(--color-primary)] dark:text-[var(--color-primary)] border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 dark:hover:!bg-[var(--color-primary)]/10"
                    onClick={() => respondInvitation({ inviteId: data.id, accept: false })}
                >
                    <Icons.X className="size-4 !stroke-[var(--color-primary)] dark:!stroke-[var(--color-primary)]" />
                </Button>
            </span>
            <span className="md:hidden grid grid-cols-[1fr_auto] gap-2">
                <Button
                    disabled={isPending}
                    size="sm"
                    variant="outline"
                    className="text-[var(--color-primary)] dark:text-[var(--color-primary)] border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 dark:hover:!bg-[var(--color-primary)]/10"
                    onClick={() => respondInvitation({ inviteId: data.id, accept: true })}
                >
                    Join {application?.name}
                </Button>
                <Button
                    disabled={isPending}
                    size="sm"
                    variant="outline"
                    className="aspect-square text-[var(--color-primary)] dark:text-[var(--color-primary)] border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 dark:hover:!bg-[var(--color-primary)]/10"
                    onClick={() => respondInvitation({ inviteId: data.id, accept: false })}
                >
                    <Icons.X className="size-4 !stroke-[var(--color-primary)] dark:!stroke-[var(--color-primary)]" />
                </Button>
            </span>
        </div>
    )
}