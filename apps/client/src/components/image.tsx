import { cn } from "@/lib/utils";
import { z } from "zod";

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    className?: string
    width?: number
    /**
     * The quality of the image, between 1 and 100
     * @default 90
     */
    quality?: number
}

const schema = z.object({
    width: z.number().optional(),
    quality: z.number().min(1).max(100).default(75),
    src: z.string().optional(),
}).transform((data) => {
    if (!data.src) {
        return undefined;
    }
    const url = new URL(encodeURIComponent(data.src), import.meta.env.VITE_IMAGE_PROCESSOR_URL);
    if (data.width) {
        url.searchParams.set('w', data.width.toString());
    }
    if (data.quality) {
        url.searchParams.set('q', data.quality.toString());
    }
    return url.toString();
})

export const ImageComponent = ({ className, ...props }: ImageProps) => {
    const src = schema.parse({ width: props.width, quality: props.quality, src: props.src });

    return <img className={cn("w-full h-full object-cover", className)} {...props} src={src} />
}
