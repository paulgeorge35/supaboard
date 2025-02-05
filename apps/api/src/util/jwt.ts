import type { CookieOptions } from "express";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";

const APP_DOMAIN = process.env.APP_DOMAIN;
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

const payloadSchema = z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
    avatar: z.string().optional(),
});

type Payload = z.infer<typeof payloadSchema>;

export async function encrypt(payload: Payload): Promise<string> {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d') // Token expires in 30 days
        .sign(secret);
}

export async function decrypt(token: string): Promise<Payload> {
    const { payload } = await jwtVerify(token, secret);
    return payloadSchema.parse(payload);
}

export async function verify(token: string): Promise<boolean> {
    try {
        await decrypt(token);
        return true;
    } catch {
        return false;
    }
}


export const cookieOptions: CookieOptions = {
    httpOnly: true,
    domain: `.${APP_DOMAIN}`,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
    // sameSite: "lax",
    sameSite: "none",
}