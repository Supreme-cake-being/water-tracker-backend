import express from 'express';
import { authCtrl } from '../../controllers/auth-controller.js';
import { validateBody } from '../../decorators/index.js';
import {
  userDailyNormaSchema,
  userEditSchema,
  userEmailSchema,
  userLoginSchema,
  userPasswordSchema,
  userSignupSchema,
} from '../../models/User.js';
import authenticate from '../../middlewares/authenticate.js';
import upload from '../../middlewares/upload.js';
import isEmptyBody from '../../middlewares/isEmptyBody.js';

const authRouter = express.Router();

const userSignupValidate = validateBody(userSignupSchema);
const userLoginValidate = validateBody(userLoginSchema);
const userEmailValidate = validateBody(userEmailSchema);
const userPasswordValidate = validateBody(userPasswordSchema);
const userEditValidate = validateBody(userEditSchema);
const userDailyNormaValidate = validateBody(userDailyNormaSchema);

authRouter.post('/signup', isEmptyBody, userSignupValidate, authCtrl.signup);

authRouter.get('/verify/:verificationToken', authCtrl.verify);

authRouter.post('/verify', userEmailValidate, authCtrl.resendEmail);

authRouter.post('/login', isEmptyBody, userLoginValidate, authCtrl.login);

authRouter.get('/current', authenticate, authCtrl.currentUser);

authRouter.post('/logout', authenticate, authCtrl.logout);

authRouter.patch(
  '/avatars',
  upload.single('avatar'),
  authenticate,
  authCtrl.uploadAvatar
);

authRouter.get('/info', authenticate, authCtrl.userInfo);

authRouter.put(
  '/',
  authenticate,
  isEmptyBody,
  userEditValidate,
  authCtrl.editInfo
);

authRouter.patch('/daily-norma', authenticate, userDailyNormaValidate, authCtrl.dailyNormaUpdate);

authRouter.post('/restore', userEmailValidate, authCtrl.restorePassword);

authRouter.delete('/', authenticate, userPasswordValidate, authCtrl.deleteAccount);

export default authRouter;
