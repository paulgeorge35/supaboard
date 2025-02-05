import { Router } from 'express';
import { applicationMiddleware } from '../../middleware/application';
import { requireAuth } from '../../middleware/auth';
import { customCookie, googleSignIn, googleSignInCallback, googleSignUpCallback, login, logout, me, register } from './auth.controller';
const router = Router();

router.get('/me', requireAuth, applicationMiddleware, me);
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/google/sign-in', googleSignIn);
router.get('/google/sign-in/callback', googleSignInCallback);
router.get('/google/sign-up/callback', googleSignUpCallback);
router.get('/custom-cookie', customCookie);

export { router as authRouter };
