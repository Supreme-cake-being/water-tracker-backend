import express from 'express';
import recordController from '../../controllers/records-controller.js';
import {
  authenticate,
  isEmptyBody,
  isValidId,
} from '../../middlewares/index.js';
import { validateBody } from '../../decorators/index.js';
import { recordAddSchema, recordUpdateSchema } from '../../models/Record.js';

const recordAddValidate = validateBody(recordAddSchema);
const recordUpdateValidate = validateBody(recordUpdateSchema);

const router = express.Router();

router.get('/', authenticate, recordController.getAll);

router.get('/today', authenticate, recordController.getAllToday);

router.get('/:recordId', authenticate, isValidId, recordController.getById);

router.post(
  '/',
  authenticate,
  isEmptyBody,
  recordAddValidate,
  recordController.add
);

router.delete(
  '/:recordId',
  authenticate,
  isValidId,
  recordController.deleteById
);

router.put(
  '/:recordId',
  authenticate,
  isValidId,
  isEmptyBody,
  recordUpdateValidate,
  recordController.updateById
);

export default router;
