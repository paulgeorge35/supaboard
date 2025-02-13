import { db, DomainStatus } from '@repo/database';
import { type NextFunction, type Response } from 'express';
import type { BareSessionRequest } from '../types';
import { decrypt } from '../util/jwt';

const COOKIE_NAME = process.env.COOKIE_NAME as string;
const APP_DOMAIN = process.env.APP_DOMAIN as string;

export async function session(req: BareSessionRequest, res: Response, next: NextFunction) {
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

        const applications = await db.application.findMany({
            where: {
                members: {
                    some: {
                        userId: decoded.id,
                    }
                }
            }
        })

        const workspaces = applications.map((application) => ({
            id: application.id,
            name: application.name,
            url: application.customDomain && application.domainStatus === DomainStatus.VERIFIED ? `https://${application.customDomain}` : `https://${application.subdomain}.${APP_DOMAIN}`,
        }));

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
        req.workspaces = workspaces;
    } catch (error) {
        console.error('Error in session middleware:', error);
        res.clearCookie(COOKIE_NAME);
        return;
    }
    
    next();
} 