import { S3Client } from "bun";

const R2_PUBLIC_ENDPOINT = process.env.R2_PUBLIC_ENDPOINT;

export const s3Client = new S3Client({
    accessKeyId: "8d2c99c96099c8936e1c3973deda209d",
    secretAccessKey: "3a9ad10a0e74b40b7e0f3f2377958d8c8177654e0c4c49792aa814b1e2460926",
    endpoint: "https://7d7ca2ce61c41c16bfd97a87751e3119.r2.cloudflarestorage.com",
    bucket: "supaboard",
    acl: "public-read",
});

export const presignReadUrl = (key: string) => {
    return s3Client.file(key).presign({
        expiresIn: 60 * 60 * 24 * 7,
        method: 'GET',
    });
};

export const presignWriteUrl = (key: string) => {
    return s3Client.file(key).presign({
        expiresIn: 60 * 60,
        method: 'PUT',
    });
};

export const remove = (key: string) => {
    return s3Client.file(key).delete();
};

export const publicUrl = (key: string) => {
    return `${R2_PUBLIC_ENDPOINT}/${key}`;
};