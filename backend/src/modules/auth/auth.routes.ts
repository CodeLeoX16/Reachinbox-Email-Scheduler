import { Router } from 'express';
import { googleLogin, demoLogin, getMe } from './auth.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/google', googleLogin);
router.post('/demo', demoLogin);
router.get('/me', requireAuth, getMe);

export default router;