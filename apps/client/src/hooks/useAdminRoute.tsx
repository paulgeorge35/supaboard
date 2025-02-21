import { useLocation } from "@tanstack/react-router";

export const useAdminRoute = () => {
    const location = useLocation();
    return location.pathname.startsWith('/admin');
}
