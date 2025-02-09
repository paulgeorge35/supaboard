import { Router } from 'express';
import { applicationMiddleware } from '../../middleware/application';
import { requireAuth } from '../../middleware/auth';
import { customCookie, googleSignIn, googleSignInCallback, googleSignUpCallback, login, logout, me, preferences, register, update, updatePreferences } from './auth.controller';
const router = Router();

router.get('/me', requireAuth, applicationMiddleware, me);
router.put('/update', requireAuth, applicationMiddleware, update);
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/google/sign-in', googleSignIn);
router.get('/google/sign-in/callback', googleSignInCallback);
router.get('/google/sign-up/callback', googleSignUpCallback);
router.get('/custom-cookie', customCookie);

router.get('/preferences', requireAuth, preferences);
router.put('/preferences', requireAuth, updatePreferences);

export { router as authRouter };
