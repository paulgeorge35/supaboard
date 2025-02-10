import { db } from '@repo/database';
import { type NextFunction, type Response } from 'express';
import type { BareSessionRequest } from '../types';
import { decrypt } from '../util/jwt';

const COOKIE_NAME = process.env.COOKIE_NAME as string;

export async function requireAuth(req: BareSessionRequest, res: Response, next: NextFunction) {
    const session = req.cookies[COOKIE_NAME];

    if (!session) {
        next();
        return;
    }

    try {
        const decoded = await decrypt(session);

        if (!decoded) {
            console.log('Invalid session[20]:', session);
            console.log('Decoded:', decoded);
            res.clearCookie(COOKIE_NAME);
            return;
        }

        const user = await db.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true },
        });

        if (!user) {
            res.clearCookie(COOKIE_NAME);
            return;
        }

        req.auth = {
            id: decoded.id,
            email: decoded.email,
            name: decoded.name,
            avatar: decoded.avatar,
        };
    } catch (error) {
        console.error('Error in requireAuth middleware:', error);
        res.clearCookie(COOKIE_NAME);
        return;
    }
    
    next();
} 