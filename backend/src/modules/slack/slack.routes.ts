import { Router } from 'express';
import { getSlackAuthUrl, handleSlackCallback, disconnectSlack } from './slack.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/auth-url', requireAuth, getSlackAuthUrl);
router.get('/callback', handleSlackCallback);
router.post('/disconnect', requireAuth, disconnectSlack);

export default router;