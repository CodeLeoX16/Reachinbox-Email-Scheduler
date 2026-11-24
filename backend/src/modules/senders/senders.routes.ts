import { Router } from 'express';
import { listSenders, createEtherealSender, createCustomSender } from './senders.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);
router.get('/', listSenders);
router.post('/ethereal', createEtherealSender);
router.post('/custom', createCustomSender);

export default router;