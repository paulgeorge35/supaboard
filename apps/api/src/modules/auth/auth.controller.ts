import { db } from '@repo/database';
import { fetch } from 'bun';
import { type Request, type Response } from 'express';
import { z } from 'zod';
import type { BareSessionRequest } from '../../types';
import { cookieOptions, encrypt } from '../../util/jwt';
import { googleClient } from '../../util/oauth';

const registerSchema = z.object({
    email: z.string().email(),
    name: z.string().min(1),
    password: z.string().min(8),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});


const profileSchema = z.object({
    name: z.string().transform((name) => {
        const [firstName, ...lastNameParts] = name.split(" ");
        const lastName = lastNameParts.join(" ");
        return { fullName: name, firstName, lastName };
    }),
    email: z.string(),
    picture: z.string(),
});

const COOKIE_NAME = process.env.COOKIE_NAME as string;
const CALLBACK_SIGN_IN_URL = process.env.GOOGLE_SIGN_IN_CALLBACK_URL as string;
const CALLBACK_SIGN_UP_URL = process.env.GOOGLE_SIGN_UP_CALLBACK_URL as string;
const APP_DOMAIN = process.env.APP_DOMAIN as string;

export async function me(req: BareSessionRequest, res: Response) {

    res.json({
        user: req.auth,
        application: req.application,
    });
}

export async function register(req: Request, res: Response) {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
        res.status(400).json({ error: 'Invalid input', details: validation.error });
        return;
    }

    const { email, password, name } = validation.data;

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
        res.status(400).json({ error: 'Email already registered' });
        return;
    }

    const hashedPassword = await Bun.password.hash(password);
    const user = await db.user.create({
        data: {
            email,
            name,
            password: hashedPassword,
        },
        select: {
            id: true,
            email: true,
        },
    });

    res.cookie('userId', user.id, cookieOptions);
    res.json({ user });
}

export async function login(req: Request, res: Response) {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
        res.status(400).json({ error: 'Invalid input', details: validation.error });
        return;
    }

    const { email, password } = validation.data;

    const user = await db.user.findUnique({ where: { email } });
    if (!user?.password) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
    }

    const isValidPassword = await Bun.password.verify(password, user.password);
    if (!isValidPassword) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
    }

    const session_token = await encrypt({ id: user.id, email: user.email, name: user.name, avatar: user.avatar ?? undefined });

    res.cookie(COOKIE_NAME, session_token, cookieOptions);
    res.json({
        user: {
            id: user.id,
            email: user.email,
        },
    });
}

export async function logout(req: Request, res: Response) {
    res.status(200).clearCookie(COOKIE_NAME, {
        ...cookieOptions,
        domain: req.headers.host?.endsWith(APP_DOMAIN) ? `.${APP_DOMAIN}` : `.${new URL(req.headers.referer as string).hostname}`,
        maxAge: undefined,
    }).json({ message: 'Logged out successfully' });
}

export async function googleSignUp(req: Request, res: Response) {
}

export async function googleSignIn(req: Request, res: Response) {
    const authorizationUri = googleClient.authorizeURL({
        redirect_uri: CALLBACK_SIGN_IN_URL,
        scope: "email profile",
        state: req.headers.referer,
    });

    const url = new URL(authorizationUri);
    if (url.searchParams.get("authError")) {
        res.status(400).json({ error: 'Failed to sign in with Google' });
        return;
    }

    res.redirect(authorizationUri);
}

export async function googleSignUpCallback(req: Request, res: Response) {
}

export async function googleSignInCallback(req: Request, res: Response) {
    try {
        const url = new URL(req.url, `https://api.supaboard.io`);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');

        if (!code) {
            res.status(400).json({ error: 'No code provided' });
            return;
        }

        if (!state) {
            res.status(400).json({ error: 'No state provided' });
            return;
        }


        const options = {
            code,
            redirect_uri: CALLBACK_SIGN_IN_URL,
        };

        const accessToken = await googleClient.getToken(options);

        const response = await fetch(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            {
                headers: {
                    Authorization: `Bearer ${accessToken.token.access_token as string}`,
                },
            },
        );

        const profile = profileSchema.parse(await response.json());

        const existingUser = await db.user.findFirst({ where: { email: profile.email, oauthAccounts: { some: { provider: 'GOOGLE' } } } });

        if (!existingUser) {
            res.redirect(state ?? '/');
            return;
        }

        const token = await encrypt({
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
            avatar: existingUser.avatar ?? undefined
        });

        const customCookieOptions = {
            ...cookieOptions,
            domain: state.includes(APP_DOMAIN) ? `.${APP_DOMAIN}` : `.${new URL(state).hostname}`
        };

        res.cookie(COOKIE_NAME, token, customCookieOptions);

        if (state.includes(APP_DOMAIN))
            res.redirect(state ?? '/');
        else {
            const url = new URL(`${state}/api/auth/custom-cookie`);
            url.searchParams.set('cookie', token);
            url.searchParams.set('state', state);

            res.redirect(url.toString());
        }
    } catch (error) {
        console.error(error);
        const state = new URL(req.url, `https://api.supaboard.io`).searchParams.get('state');
        res.redirect(state ?? '/');
    }
}

export async function customCookie(req: Request, res: Response) {
    const { cookie, state } = req.query;

    res.cookie(COOKIE_NAME, cookie as string, {
        ...cookieOptions,
        domain: `${new URL(state as string).hostname}`
    });
    res.redirect(state as string);
}