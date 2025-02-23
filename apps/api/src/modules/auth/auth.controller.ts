import type { BareSessionRequest } from '@/types';
import { cookieOptions, encrypt, googleClient, presignReadUrl, redis, sendPasswordResetEmail } from '@/util';
import { parseAndThrowFirstError } from '@/util/error-parser';
import { AdminReportFrequency, db, Language } from '@repo/database';
import { fetch } from 'bun';
import { type Request, type Response } from 'express';
import { UAParser } from 'ua-parser-js';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

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
    let user = req.auth;

    if (user?.avatar?.startsWith('avatar')) {
        user.avatar = presignReadUrl(user.avatar);
    }

    res.json({
        user: req.auth,
        workspaces: req.workspaces,
        application: req.application,
    });
}

const updateSchema = z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    avatar: z.string().optional(),
});

export async function update(req: BareSessionRequest, res: Response) {
    const userId = req.auth?.id;

    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const { success, data, error } = updateSchema.safeParse(req.body);

    if (!success) {
        res.status(400).json({ error: 'Invalid input', details: error });
        return;
    }

    await db.user.update({
        where: { id: userId },
        data: data,
    });

    res.status(200).json({ message: 'User updated successfully' });
}

async function requestPasswordReset(req: Request, res: Response) {
    const { email } = req.body;

    const baseUrl = new URL(req.headers.referer as string);

    const user = await db.user.findUnique({ where: { email } });

    if (user) {
        const token = uuidv4();
        await redis.set(`password-reset-${token}`, user.id);
        await redis.expire(`password-reset-${token}`, 60 * 60 * 24);

        await sendPasswordResetEmail({
            email: user.email,
            resetLink: `${baseUrl.origin}/password-reset/${token}`,
        });
    }

    res.status(200).json({ message: 'Password reset requested' });
}

async function verifyPasswordReset(req: Request, res: Response) {
    const { token } = req.body;

    const userId = await redis.get(`password-reset-${token}`);

    if (!userId) {
        res.status(400).json({ success: false, error: 'Invalid token' });
        return;
    }

    res.status(200).json({ success: true });
}

const resetPasswordSchema = z.object({
    token: z.string(),
    password: z.string().min(8),
});

async function resetPassword(req: Request, res: Response) {
    const { token, password } = resetPasswordSchema.parse(req.body);

    const userId = await redis.get(`password-reset-${token}`);

    if (!userId) {
        res.status(400).json({ error: 'Invalid token' });
        return;
    }

    await db.user.update({ where: { id: userId }, data: { password: await Bun.password.hash(password) } });
    await redis.del(`password-reset-${token}`);

    res.status(200).json({ message: 'Password reset successfully' });
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
            name: true,
            avatar: true,
        },
    });

    const session_token = await encrypt({ id: user.id, email: user.email, name: user.name, avatar: user.avatar ?? undefined });

    res.cookie(COOKIE_NAME, session_token, cookieOptions);
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

    const customCookieOptions = {
        ...cookieOptions,
        domain: req.headers.referer?.includes(APP_DOMAIN) ? `.${APP_DOMAIN}` : `.${new URL(req.headers.referer as string).hostname}`
    };

    res.cookie(COOKIE_NAME, session_token, customCookieOptions);

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
    const authorizationUri = googleClient.authorizeURL({
        redirect_uri: CALLBACK_SIGN_UP_URL,
        scope: "email profile",
        state: req.headers.referer,
    });

    res.redirect(authorizationUri);
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
    try {
        const parser = UAParser(req.headers['user-agent']);

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
            redirect_uri: CALLBACK_SIGN_UP_URL,
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

        if (existingUser) {
            await db.user.update({
                where: { id: existingUser.id },
                data: {
                    os: `${parser.os.name} ${parser.os.version}`,
                    browser: parser.browser.name,
                    device: `${parser.device.vendor} ${parser.device.model}`,
                }
            });
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
                const baseUrl = new URL(state).origin;
                const url = new URL(`${baseUrl}/api/auth/custom-cookie`);
                url.searchParams.set('cookie', token);
                url.searchParams.set('state', state);
                url.searchParams.set('redirect', state);

                res.redirect(url.toString());
            }
        }

        const user = await db.user.create({
            data: {
                email: profile.email,
                name: profile.name.fullName,
                avatar: profile.picture,
                oauthAccounts: {
                    create: {
                        provider: 'GOOGLE',
                        providerAccountId: profile.email,
                    },
                },
            },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
            },
        });

        const session_token = await encrypt({ id: user.id, email: user.email, name: user.name, avatar: user.avatar ?? undefined });

        res.cookie(COOKIE_NAME, session_token, cookieOptions);
        res.json({ user });
    } catch (error) {
        console.error(error);
        const state = new URL(req.url, `https://api.supaboard.io`).searchParams.get('state');
        res.redirect(state ?? '/');
    }
}

export async function googleSignInCallback(req: Request, res: Response) {
    try {
        const parser = UAParser(req.headers['user-agent']);

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

        await db.user.update({
            where: { id: existingUser.id },
            data: {
                os: `${parser.os.name} ${parser.os.version}`,
                browser: parser.browser.name,
                device: `${parser.device.vendor} ${parser.device.model}`,
            }
        });

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
            const baseUrl = new URL(state).origin;
            const url = new URL(`${baseUrl}/api/auth/custom-cookie`);
            url.searchParams.set('cookie', token);
            url.searchParams.set('state', state);
            url.searchParams.set('redirect', state);

            res.redirect(url.toString());
        }
    } catch (error) {
        console.error(error);
        const state = new URL(req.url, `https://api.supaboard.io`).searchParams.get('state');
        res.redirect(state ?? '/');
    }
}

export async function customCookie(req: Request, res: Response) {
    const { cookie, state, redirect } = req.query;

    res.cookie(COOKIE_NAME, cookie as string, {
        ...cookieOptions,
        domain: `${new URL(state as string).hostname}`
    });
    res.redirect(redirect as string);
}

export async function preferences(req: BareSessionRequest, res: Response) {
    const userId = req.auth?.id;

    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const user = await db.user.findUnique({
        where: { id: userId }, select: {
            reportFrequency: true,
            language: true,
        }
    });

    res.status(200).json({ user });
}

const updatePreferencesSchema = z.object({
    reportFrequency: z.nativeEnum(AdminReportFrequency).optional(),
    language: z.nativeEnum(Language).optional(),
});

export async function updatePreferences(req: BareSessionRequest, res: Response) {
    const userId = req.auth?.id;

    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const { success, data, error } = updatePreferencesSchema.safeParse(req.body);

    if (!success) {
        res.status(400).json({ error: 'Invalid input', details: error });
        return;
    }

    const user = await db.user.update({ where: { id: userId }, data, });

    res.status(200).json({ user });
}

const invitation = async (req: BareSessionRequest, res: Response) => {
    const userId = req.auth?.id;
    const applicationId = req.application?.id!;

    if (!userId) {
        res.status(200);
        return;
    }

    const user = await db.user.findUnique({ where: { id: userId } });

    if (!user) {
        res.status(200);
        return;
    }

    const invite = await db.applicationInvite.findFirst({
        where: { email: user.email, applicationId, acceptedAt: null, rejectedAt: null },
        select: {
            id: true,
            email: true,
            role: true,
            invitedBy: {
                select: {
                    name: true,
                    avatar: true,
                }
            }
        }
    })

    if (!invite) {
        res.status(200);
        return;
    }


    res.status(200).json(invite);
}

const respondInvitationSchema = z.object({
    inviteId: z.string().uuid(),
    accept: z.coerce.boolean(),
});

const respondInvitation = async (req: BareSessionRequest, res: Response) => {
    const userId = req.auth?.id!;
    const applicationId = req.application?.id!;

    const data = parseAndThrowFirstError(respondInvitationSchema, req.body, res);

    const invite = await db.applicationInvite.findUnique({ where: { id: data.inviteId, applicationId, acceptedAt: null, rejectedAt: null } });

    if (!invite) {
        res.status(400).json({ error: 'Invitation not found' });
        return;
    }

    if (data.accept) {
        await db.applicationInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date(), user: { connect: { id: userId } } } });
        await db.member.upsert({ where: { userId_applicationId: { userId, applicationId } }, update: { role: invite.role }, create: { userId, applicationId, role: invite.role } });
        res.status(200).json({ message: 'You have accepted the invitation' });
    } else {
        await db.applicationInvite.update({ where: { id: invite.id }, data: { rejectedAt: new Date() } });
        res.status(200).json({ message: 'You have rejected the invitation' });
    }
}

export const controller = {
    auth: {
        me,
        register,
        login,
        logout,
        customCookie,
    },
    invitation: {
        get: invitation,
        respond: respondInvitation,
    },
    password: {
        requestReset: requestPasswordReset,
        verifyReset: verifyPasswordReset,
        reset: resetPassword,
    },
    profile: {
        update,
    },
    preferences: {
        get: preferences,
        update: updatePreferences,
    },
    oauth: {
        googleSignUp,
        googleSignIn,
        googleSignUpCallback,
        googleSignInCallback,
    }
}