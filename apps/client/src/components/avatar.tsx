import { fetchClient } from "@/lib/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { cn } from "../lib/utils";
import { Icons } from "./icons";
import { ImageComponent } from "./image";
import { Skeleton } from "./skeleton";

type AvatarProps = React.HTMLAttributes<HTMLDivElement> & {
    src?: string;
    name: string;
    className?: string;
    isAdmin?: boolean;
    width?: number;
    quality?: number;
}

const colors = [
    {
        bg: 'bg-blue-500/20',
        text: 'text-blue-500',
    },
    {
        bg: 'bg-green-500/20',
        text: 'text-green-500',
    },
    {
        bg: 'bg-red-500/20',
        text: 'text-red-500',
    },
    {
        bg: 'bg-purple-500/20',
        text: 'text-purple-500',
    },
    {
        bg: 'bg-yellow-500/20',
        text: 'text-yellow-500',
    },
    {
        bg: 'bg-orange-500/20',
        text: 'text-orange-500',
    },
]

export function Avatar({ src, name, className, isAdmin, width = 32, quality = 50, ...props }: AvatarProps) {
    const [imgError, setImgError] = useState(false);

    const { data: uploadedFile, isLoading } = useQuery<{ url: string }>({
        queryKey: ['storage', src!, 'read'],
        queryFn: async () => await fetchClient(`storage/${src}/read`, {
            method: 'GET',
        }),
        enabled: !!src && src.startsWith('avatar/'),
        staleTime: 5 * 60 * 1000, // 5 minutes cache
        refetchOnWindowFocus: false,
    })

    const color = colors[(name.charCodeAt(0) ?? 0) % colors.length]

    const handleImageError = () => {
        setImgError(true);
    };

    // Check if we should show a skeleton loader
    const isLoadingAvatar = !!src && src.startsWith('avatar/') && isLoading;

    // Determine if we should show the placeholder
    const shouldShowPlaceholder = useMemo(() => {
        // If image has an error, show placeholder
        if (imgError) return true;
        
        // If no source or no uploaded file URL when needed
        return (!uploadedFile?.url && !src);
    }, [uploadedFile, src, imgError]);

    // Determine the final image source
    const imageSource = useMemo(() => {
        if (uploadedFile?.url) return uploadedFile.url;
        if (src) return src;
        return "";
    }, [uploadedFile, src]);

    return (
        <div
            className={cn("size-8 rounded-full relative", className)}
            {...props}
        >
            {isAdmin && <Icons.Star className="absolute z-10 -right-[5%] -bottom-[5%] size-[40%] p-[1px] bg-[var(--color-primary)] stroke-[var(--color-primary)] rounded-full fill-white border-white" />}
            {isLoadingAvatar ? (
                // Show skeleton while loading avatar images
                <Skeleton className="size-full rounded-full" />
            ) : !shouldShowPlaceholder ? (
                // Show the image when loaded or direct src is provided
                <ImageComponent
                    width={width}
                    quality={quality}
                    src={imageSource}
                    alt={name}
                    className="size-full rounded-full"
                    onError={handleImageError}
                />
            ) : (
                // Show the placeholder (initials) when no image is available
                <span
                    className={cn("aspect-square w-full rounded-full flex items-center justify-center", color.bg, color.text)}
                >
                    {name.slice(0, 1).toUpperCase()}
                </span>
            )}
        </div>
    )
}