import { useMutation } from "@tanstack/react-query"
import { useRouter, useSearch } from "@tanstack/react-router"
import { toast } from "sonner"
import { fetchClient } from "../lib/client"
import { closeModal, getModal, Modal } from "./modal"

type DeleteFeedbackButtonProps = {
    boardSlug: string
    feedbackSlug: string
    to?: string
}

export function DeleteFeedbackButton({ boardSlug, feedbackSlug, to = '/$boardSlug' }: DeleteFeedbackButtonProps) {
    const search = useSearch({ strict: false })
    const router = useRouter()
    const { mutate: deleteFeedback, isPending } = useMutation({
        mutationFn: () => fetchClient(`/feedback/${boardSlug}/${feedbackSlug}`, {
            method: 'DELETE'
        }),
        onSuccess: () => {
            toast.success('Feedback deleted successfully')
            router.navigate({ to, params: { boardSlug }, search, replace: true })
        },
        onError: () => {
            toast.error('Failed to delete feedback')
        }
    })

    const handleDelete = () => {
        deleteFeedback()
    }

    const handleCancel = () => {
        if (getModal()) {
            closeModal(getModal() as HTMLElement)
        }
    }

    return (
        <>
            <p className="text-xs text-gray-500">&bull;</p>
            <Modal
                trigger='Delete'
                triggerClassName="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200 cursor-pointer"
                dismissable={false}
                contentClassName="max-w-sm"
                footer={
                    <div className="horizontal gap-2 center-v justify-end">
                        <button type="button" onClick={handleCancel} className="button button-secondary" disabled={isPending}>Cancel</button>
                        <button type="button" onClick={handleDelete} className="button button-primary" disabled={isPending}>{isPending ? 'Deleting...' : 'Delete'}</button>
                    </div>
                }
            >
                <div>
                    <p>Are you sure you want to delete this feedback?</p>
                </div>
            </Modal>
        </>
    )
}