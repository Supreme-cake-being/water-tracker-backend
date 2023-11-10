import express from 'express';
import { authCtrl } from '../../controllers/auth-controller.js';
import { validateBody } from '../../decorators/index.js';
import { userEmailSchema, userLoginSchema, userSignupSchema } from '../../models/User.js';
import authenticate from '../../middlewares/authenticate.js';

const authRouter = express.Router(); 

const userSignupValidate = validateBody(userSignupSchema);
const userLoginValidate = validateBody(userLoginSchema);
const userEmailValidate = validateBody(userEmailSchema);

authRouter.post('/signup', userSignupValidate, authCtrl.signup);

authRouter.get('/verify/:verificationToken', authCtrl.verify);

authRouter.post('/verify', userEmailValidate, authCtrl.resendEmail);

authRouter.post('/login', userLoginValidate, authCtrl.login);

authRouter.get('/current', authenticate, authCtrl.currentUser);

authRouter.post('/logout', authenticate, authCtrl.logout);

export default authRouter;