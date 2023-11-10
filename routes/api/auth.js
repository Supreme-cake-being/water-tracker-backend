import express from 'express';
import { authCtrl } from '../../controllers/auth-controller.js';
import { validateBody } from '../../decorators/index.js';
import { userEmailSchema, userSignupSchema } from '../../models/User.js';

const authRouter = express.Router(); 

const userSignupValidate = validateBody(userSignupSchema);
const userEmailValidate = validateBody(userEmailSchema);

authRouter.post('/signup', userSignupValidate, authCtrl.signup);

authRouter.get('/verify/:verificationToken', authCtrl.verify);

authRouter.post('/verify', userEmailValidate, authCtrl.resendEmail);

export default authRouter;