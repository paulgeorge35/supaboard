import { createFileRoute, Navigate, useParams } from '@tanstack/react-router';

export const Route = createFileRoute('/password-reset/')({
    component: RouteComponent,
})

function RouteComponent() {
    const { token } = useParams({ strict: false });

    if (!token) {
        return <Navigate to="/" />
    }

    return <Navigate to="/password-reset/$token" params={{ token }} />
}
