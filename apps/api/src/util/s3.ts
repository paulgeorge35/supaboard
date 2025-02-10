import { S3Client } from "bun";

const R2_PUBLIC_ENDPOINT = process.env.R2_PUBLIC_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_ENDPOINT = process.env.R2_ENDPOINT;

export const s3Client = new S3Client({
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    endpoint: R2_ENDPOINT,
    bucket: R2_BUCKET_NAME,
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