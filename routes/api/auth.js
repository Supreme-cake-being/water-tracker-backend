import express from 'express';
import { authCtrl } from '../../controllers/auth-controller.js';
import { validateBody } from '../../decorators/index.js';
import { 
    userEditSchema, 
    userEmailSchema, 
    userLoginSchema, 
    userSignupSchema 
} from '../../models/User.js';
import authenticate from '../../middlewares/authenticate.js';
import upload from '../../middlewares/upload.js';

const authRouter = express.Router(); 

const userSignupValidate = validateBody(userSignupSchema);
const userLoginValidate = validateBody(userLoginSchema);
const userEmailValidate = validateBody(userEmailSchema);
const userEditValidate = validateBody(userEditSchema);

authRouter.post('/signup', userSignupValidate, authCtrl.signup);

authRouter.get('/verify/:verificationToken', authCtrl.verify);

authRouter.post('/verify', userEmailValidate, authCtrl.resendEmail);

authRouter.post('/login', userLoginValidate, authCtrl.login);

authRouter.get('/current', authenticate, authCtrl.currentUser);

authRouter.post('/logout', authenticate, authCtrl.logout);

authRouter.patch('/avatars', upload.single('avatar'), authenticate, authCtrl.uploadAvatar);

authRouter.get('/info', authenticate, authCtrl.userInfo);

authRouter.put('/', authenticate, userEditValidate, authCtrl.editInfo);

export default authRouter;