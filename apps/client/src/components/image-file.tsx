import { useEffect } from "react";

import { fetchClient } from "@/lib/client";
import { cn } from "@/lib/utils";
import { useBoolean } from "@paulgeorge35/hooks";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Icons } from "./icons";
import { ImageComponent } from "./image";
import { ModalComponent } from "./modal-component";
import { Skeleton } from "./skeleton";
import { LoadingSpinner } from "./spinner";

export type ImageFile = {
    file: File;
    key: string;
    name: string;
    extension: string;
    contentType: string;
    size: number;
}

export type ImageFileProps = {
    file?: File;
    fileKey: string;
    width?: number;
    height?: number;
    ratio?: number;
    onRemove?: () => void;
    className?: string;
}

/**
 * Preprocesses an image by resizing it according to specified dimensions
 * @param file Original image file
 * @param width Desired width in pixels
 * @param height Desired height in pixels
 * @param ratio Desired aspect ratio (width/height)
 * @returns Promise<File> Processed image file
 */
async function preprocessImage(
    file: File,
    width?: number,
    height?: number,
    ratio?: number
): Promise<File> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = () => {
            let targetWidth = width || img.width;
            let targetHeight = height || img.height;

            // Apply ratio if specified
            if (ratio) {
                if (width) {
                    targetHeight = width / ratio;
                } else if (height) {
                    targetWidth = height * ratio;
                } else {
                    targetWidth = img.width;
                    targetHeight = img.width / ratio;
                }
            }

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }

            // Draw resized image
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

            // Convert to blob
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Failed to create blob'));
                        return;
                    }
                    // Create new file with same name but processed content
                    const processedFile = new File([blob], file.name, {
                        type: file.type,
                        lastModified: file.lastModified,
                    });
                    resolve(processedFile);
                },
                file.type,
                0.9  // Quality parameter
            );
        };

        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };

        img.src = URL.createObjectURL(file);
    });
}

export function ImageFile({ file, fileKey: key, width, height, ratio, onRemove, className }: ImageFileProps) {
    const [uploaded, setUploaded] = useState(file ? false : true);
    const [processedFile, setProcessedFile] = useState<File | undefined>(file);
    const imageModal = useBoolean(false)

    const { data: uploadedFile } = useQuery<{ url: string }>({
        queryKey: ['storage', key, 'read'],
        queryFn: async () => await fetchClient(`storage/${key}/read`, {
            method: 'GET',
        }),
        enabled: uploaded,
    })

    const { mutate: upload } = useMutation({
        mutationFn: async () => await fetchClient(`storage/${key}/write`, {
            method: 'PUT',
        }),
        onSuccess: (data) => {
            uploadFile(data.url, processedFile);
        },
    })

    const handleRemove = () => {
        setUploaded(false);
        onRemove?.();
    }

    useEffect(() => {
        async function processAndUpload() {
            if (file && !uploaded) {
                try {
                    const processed = await preprocessImage(file, width, height, ratio);
                    setProcessedFile(processed);
                    upload();
                } catch (error) {
                    console.error('Failed to process image:', error);
                    // Fall back to original file
                    setProcessedFile(file);
                    upload();
                }
            }
        }

        processAndUpload();
    }, [file]);

    const uploadFile = async (url: string, file?: File) => {
        if (!processedFile) return;
        const response = await fetch(url, {
            method: 'PUT',
            body: file,
        });
        if (!response.ok) {
            throw new Error('Failed to upload file');
        }
        setUploaded(true);
    };

    const handleClick = () => {
        if (uploadedFile) {
            // window.open(uploadedFile.url, '_blank');
            imageModal.toggle()
        }
    }

    return (
        <>
            {uploadedFile && <ModalComponent isOpen={imageModal.value} onClose={imageModal.toggle} className="!p-0 rounded-none border-none max-w-none horizontal center !bg-transparent !shadow-none">
                {imageModal.value && <ImageComponent src={uploadedFile?.url} alt={file?.name} className="h-full cursor-pointer shadow-md" onClick={handleClick} />}
            </ModalComponent>}
            <span className={cn("relative max-h-24 h-24 rounded-xl overflow-hidden shadow-lg", className)}>
                {uploadedFile && uploaded ?
                    <ImageComponent width={200} quality={30} src={uploadedFile?.url} alt={file?.name} className="max-h-24 cursor-pointer" onClick={handleClick} />
                    :
                    <Skeleton className="h-full aspect-square horizontal center">
                        <LoadingSpinner />
                    </Skeleton>
                }
                {onRemove && uploadedFile && uploaded &&
                    <button type="button" className="absolute top-2 right-2 rounded-full bg-white/50 hover:bg-white/80 transition-colors duration-200 p-1 cursor-pointer" onClick={handleRemove}>
                        <Icons.X className="size-3 stroke-zinc-800" />
                    </button>
                }
            </span>
        </>
    );
}