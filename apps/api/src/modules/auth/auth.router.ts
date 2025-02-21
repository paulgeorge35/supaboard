import { application, session } from '@/middleware';
import { Router } from 'express';
import { controller, } from './auth.controller';
const router = Router();

router.get('/me', application, controller.auth.me);
router.post('/register', controller.auth.register);
router.post('/login', controller.auth.login);
router.post('/logout', controller.auth.logout);

router.post('/password/request-reset', controller.password.requestReset);
router.post('/password/verify-reset', controller.password.verifyReset);
router.post('/password/reset', controller.password.reset);

router.put('/update', application, controller.profile.update);

router.get('/custom-cookie', controller.auth.customCookie);

router.get('/google/sign-in', controller.oauth.googleSignIn);
router.get('/google/sign-up', controller.oauth.googleSignUp);
router.get('/google/sign-in/callback', controller.oauth.googleSignInCallback);
router.get('/google/sign-up/callback', controller.oauth.googleSignUpCallback);

router.get('/preferences', session, controller.preferences.get);
router.put('/preferences', session, controller.preferences.update);

export { router as authRouter };
