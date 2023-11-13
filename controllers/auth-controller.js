import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { ctrlWrapper } from '../decorators/index.js';
import HttpError from '../helpers/HttpError.js';
import { User } from '../models/User.js';
import sendEmail from '../helpers/sendEmail.js';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises';

const {
  JWT_SECRET,
  BASE_URL,
  CLOUDINARU_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

cloudinary.config({
  cloud_name: CLOUDINARU_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

const signup = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    throw HttpError(409, 'Email is already in use');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationToken = nanoid();

  const newUser = await User.create({
    username: email,
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
        `,
  };

  await sendEmail(emailVerificationData);

  res.status(201).json({
    user: {
      username: newUser.username,
      email: newUser.email,
      avatarURL: newUser.avatar.url,
      gender: newUser.gender,
    },
  });
};

const verify = async (req, res) => {
  const { verificationToken } = req.params;
  const user = await User.findOne({ verificationToken });

  if (!user) {
    throw HttpError(404);
  }

  await User.findByIdAndUpdate(user._id, {
    verificationToken: null,
    verify: true,
  });

  res.json({ message: 'Verification successful' });
};

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
        `,
  };

  await sendEmail(emailVerificationData);

  res.json({ message: 'Verification email sent' });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw HttpError(401, 'Email or password is wrong');
  }

  if (!user.verify) {
    throw HttpError(401, 'Email not verified');
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
      gender: user.gender,
    },
    token,
  });
};

const currentUser = async (req, res) => {
  const { email } = req.user;
  const user = await User.findOne({ email });

  res.json({
    user: {
      username: user.username,
      email,
      avatarURL: user.avatar.url,
      gender: user.gender,
    },
  });
};

const logout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: null });

  res.status(204).json();
};

const uploadAvatar = async (req, res) => {
  const { path } = req.file;
  const user = req.user;

  try {
    const currentAvatar = await cloudinary.api.resource(user.avatar.publicId);
    if (currentAvatar) {
      await cloudinary.uploader.destroy(currentAvatar.public_id);
    }
  } catch (error) {}

  const cloudImage = await cloudinary.uploader.upload(path, {
    folder: `avatars/${user._id}`,
  });

  const imageTransformatedURL = cloudinary.url(cloudImage.public_id, {
    width: 300,
    height: 300,
    crop: 'fill',
    gravity: 'faces',
  });

  await fs.unlink(path);

  await User.findByIdAndUpdate(user._id, {
    avatar: { url: imageTransformatedURL, publicId: cloudImage.public_id },
  });

  res.json({
    avatarURL: imageTransformatedURL,
  });
};

const userInfo = async (req, res) => {
  const user = req.user;

  res.json({
    user: {
      username: user.username,
      email: user.email,
      avatarURL: user.avatar.url,
      gender: user.gender,
    },
  });
};

const editInfo = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const { _id, password } = req.user;
  let hashedNewPassword = undefined;

  if (newPassword) {
    const comparedPassword = await bcrypt.compare(oldPassword, password);

    if (comparedPassword) {
      hashedNewPassword = await bcrypt.hash(newPassword, 10);
    } else {
      throw HttpError(401, 'Password is wrong');
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    _id,
    { ...req.body, password: hashedNewPassword },
    { new: true }
  );

  res.json({
    message: 'User info was edited with success',
    user: {
      username: updatedUser.username,
      email: updatedUser.email,
      avatarURL: updatedUser.avatar.url,
      gender: updatedUser.gender,
    },
  });
};

export const authCtrl = {
  signup: ctrlWrapper(signup),
  verify: ctrlWrapper(verify),
  resendEmail: ctrlWrapper(resendEmail),
  login: ctrlWrapper(login),
  currentUser: ctrlWrapper(currentUser),
  logout: ctrlWrapper(logout),
  uploadAvatar: ctrlWrapper(uploadAvatar),
  userInfo: ctrlWrapper(userInfo),
  editInfo: ctrlWrapper(editInfo),
};
