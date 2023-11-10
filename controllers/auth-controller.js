import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { ctrlWrapper } from '../decorators/index.js';
import HttpError from '../helpers/HttpError.js';
import { User } from '../models/User.js';
import sendEmail from '../helpers/sendEmail.js';
import jwt from 'jsonwebtoken';

const { JWT_SECRET, BASE_URL } = process.env;

const signup = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user) {
        throw HttpError(409, 'Email is already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = nanoid();

    const newUser = await User.create({
        ...req.body,
        password: hashedPassword,
        verificationToken,
    });

    const emailVerificationData = {
        to: newUser.email,
        subject: 'Email verification',
        html: `
            <strong>To verify your accont, please
                <a href='${BASE_URL}/api/users/verify/${verificationToken}'>
                    click here
                </a>
            </strong>
        `
    }

    await sendEmail(emailVerificationData);

    res.status(201).json({
        user: {
            username: newUser.username,
            email: newUser.email,
            avatarURL: newUser.avatar.url,
        }
    })
}

const verify = async (req, res) => {
    const { verificationToken } = req.params;
    const user = await User.findOne({ verificationToken });

    if (!user) {
        throw HttpError(404);
    }

    await User.findByIdAndUpdate(user._id, { verificationToken: null, verify: true });

    res.json({ message: 'Verification successful' }); 
}

const resendEmail = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        throw HttpError(404);
    }

    if (user.verify) {
        throw HttpError(400, 'Verification has already been passed');
    }

    const emailVerificationData = {
        to: user.email,
        subject: 'Email verification',
        html: `
            <strong>To verify your accont, please
                <a href='${BASE_URL}/api/users/verify/${user.verificationToken}'>
                    click here
                </a>
            </strong>
        `
    }

    await sendEmail(emailVerificationData);

    res.json({ message: 'Verification email sent' });
}

const login = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if(!user) {
        throw HttpError(401, 'Email or password is wrong');
    }

    if (!user.verify) {
        throw HttpError(401, 'Email is not already verifyed');
    }

    const comparedPassword = await bcrypt.compare(password, user.password);

    if (!comparedPassword) {
        throw HttpError(401, 'Email or password is wrong');
    }

    const payload = { id: user._id };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    await User.findByIdAndUpdate(user._id, { token });

    res.json({
        user: {
            username: user.username,
            email,
            avatarURL: user.avatar.url,
        },
        token,
    })

}

const currentUser = async (req, res) => {
    const { email } = req.user;
    const user = await User.findOne({ email });

    res.json({
        user: {
            username: user.username,
            email,
            avatarURL: user.avatar.url,
        },
    })
}

export const authCtrl = {
    signup: ctrlWrapper(signup),
    verify: ctrlWrapper(verify),
    resendEmail: ctrlWrapper(resendEmail),
    login: ctrlWrapper(login),
    currentUser: ctrlWrapper(currentUser),
}