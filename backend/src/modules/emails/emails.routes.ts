import { Router } from 'express';
import { scheduleEmails, listEmails, getEmailById } from './emails.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);
router.post('/schedule', scheduleEmails);
router.get('/', listEmails);
router.get('/:id', getEmailById);

export default router;