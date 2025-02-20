import { db } from '@repo/database';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Application } from 'express';
import helmet from 'helmet';
import { adminRouter } from './modules/admin/admin.router';
import { applicationRouter } from './modules/application/application.router';
import { authRouter } from './modules/auth/auth.router';
import { boardRouter } from './modules/board/board.router';
import { changelogRouter } from './modules/changelog/changelog.router';
import { feedbackRouter } from './modules/feedback/feedback.router';
import { roadmapRouter } from './modules/roadmap/roadmap.router';
import { storageRouter } from './modules/storage/storage.router';
/**
 * Initializes CORS configuration by fetching allowed origins from the database
 */
async function initializeCorsOrigins(): Promise<string[]> {
    const [applications, tenants] = await Promise.all([
        db.application.findMany({
            where: {
                customDomain: { not: null },
                domainStatus: "VERIFIED",
            },
            select: { customDomain: true }
        }),
        db.application.findMany({
            select: { subdomain: true }
        })
    ]);

    const customDomains = applications.map(app => `https://${app.customDomain}`);
    const tenantDomains = tenants.map(app => `https://${app.subdomain}.supaboard.io`);

    return [...customDomains, ...tenantDomains, 'https://supaboard.io', 'http://localhost:3001'];
}

/**
 * Creates and configures the Express application
 */
async function createApp(): Promise<Application> {
    const app = express();

    // Security middleware
    app.use(helmet());
    app.use(compression());

    // CORS configuration
    const whitelist = await initializeCorsOrigins();
    app.use(cors({
        origin: (origin, callback) => {
            if (!origin || whitelist.includes(origin) || origin.match(/^https:\/\/([a-z0-9-]+\.)*supaboard\.io$/)) {
                callback(null, origin);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    }));

    // Body parsing middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    // Basic route (temporary)
    app.get('/hello', (_, res) => {
        res.json({ message: 'Hello World' });
    });

    // Routes
    app.use('/auth', authRouter);
    app.use('/application', applicationRouter);
    app.use('/board', boardRouter);
    app.use('/feedback', feedbackRouter);
    app.use('/admin', adminRouter);
    app.use('/storage', storageRouter);
    app.use('/roadmap', roadmapRouter);
    app.use('/changelog', changelogRouter);
    
    return app;
}

export { createApp };
