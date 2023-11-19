import bcrypt from 'bcryptjs';
import { nanoid, customAlphabet } from 'nanoid';
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
            <table style='background-color: #2F2F2F; font-size: 16px; margin: 0 auto; border: none'>
              <thead style='padding: 15px 20px'>
                <tr>
                  <td style='color: #fff; text-align: center'>
                    <h2>Welcome, dear customer!</h2>
                    <p>The our team is glad to see you on this <strong>Water Track</strong> service.</p>
                  </td>
                </tr>
              </thead>

              <tbody style='color: #2F2F2F; background-color: #fff'>
                <tr>
                  <td style='padding: 15px 20px'>
                    <p style='text-align: center'>We must verificate your <strong>e-mail</strong> address.</p>
                    <p style='text-align: center'>It's simple, a one think you have to do -  is to follow this link:
                      <strong>
                        <a href='${BASE_URL}/api/users/verify/${verificationToken}'>
                          click here
                        </a>
                      </strong>
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
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
    throw HttpError(403, 'Forbidden request due to not verified email');
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
      dailyNorma: user.dailyNorma,
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
      dailyNorma: user.dailyNorma,
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
      dailyNorma: user.dailyNorma,
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
      dailyNorma: updatedUser.dailyNorma,
    },
  });
};

const restorePassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw HttpError(404, 'User with this e-mail was no registrated at yet');
  }

  if (!user.verify) {
    throw HttpError(403, 'Forbidden request due to not verified email');
  }

  const customNanoid = customAlphabet('qQwWeErRtTyYuUiIoOpPaAsSdDfFgGhHjJkKlLzZxXcCvVbBnNmM');
  const temporaryPassword = `!${customNanoid(9)}`;
  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

  await User.findOneAndUpdate(user._id, { password: hashedPassword });

  const newEmailMessage = {
    to: email,
    subject: 'User password settings',
    html: `
      <table style='background-color: #2F2F2F; font-size: 16px; margin: 0 auto; border: none'>
        <thead style='padding: 15px 20px'>
          <tr>
            <td>
              <h2 style='color: #fff; text-align: center'>You forgot password?</h2>
            </td>
          </tr>
        </thead>

        <tbody style='color: #2F2F2F; padding: 15px 20px; background-color: #fff'>
          <tr>
            <td>
              <p style='text-align: center'>We generated for you a new random password, witch you can enter into your account.</p>
              <p style='text-align: center'>This is your temporary password: <strong>${temporaryPassword}</strong>.</p>
              <p style='text-align: center'>We strongly reccomend you to change this passwrod as soon as possible on your profile config page.</p>
            </td>
          </tr>
        </tbody>
      </table>
    `
  };

  await sendEmail(newEmailMessage);

  res.json({ message: 'Check e-mail address you`ve been indicated before' });
}

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
  restorePassword: ctrlWrapper(restorePassword),
};
