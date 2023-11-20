import { Schema, model } from 'mongoose';
import Joi from 'joi';

const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
const passwordRegex = /^(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,64}$/;

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Set password for user'],
    },
    avatar: {
      url: {
        type: String,
        default: null,
      },
      publicId: {
        type: String,
        default: null,
      },
    },
    gender: {
      type: String,
      default: 'male',
    },
    dailyNorma: {
      type: Number,
      default: 2,
    },
    token: String,
    verificationToken: {
      type: String,
      default: '',
    },
    verify: {
      type: Boolean,
      default: false,
    },
  },
  { versionKey: false, timestamps: true }
);

const User = model('user', userSchema);

const userSignupSchema = Joi.object({
  username: Joi.string().min(3).max(32),
  email: Joi.string().pattern(emailRegex).required(),
  password: Joi.string().pattern(passwordRegex).required(),
});

const userLoginSchema = Joi.object({
  email: Joi.string().pattern(emailRegex).required(),
  password: Joi.string().pattern(passwordRegex).required(),
});

const userEmailSchema = Joi.object({
  email: Joi.string().pattern(emailRegex).required(),
});

const userPasswordSchema = Joi.object({
  password: Joi.string().pattern(passwordRegex).required(),
});

const userEditSchema = Joi.object({
  type: Joi.string().required().valid('withPassword', 'withoutPassword'),
  username: Joi.string().min(3).max(32).required(),
  email: Joi.string().pattern(emailRegex).required(),
  gender: Joi.string().valid('male', 'female').required(),
  dailyNorma: Joi.number().required(),
  oldPassword: Joi.alternatives().conditional('type', [
    {
      is: 'withPassword',
      then: Joi.string().pattern(passwordRegex).required(),
    },
    {
      is: 'withoutPassword',
      then: Joi.valid(null),
    },
  ]),
  newPassword: Joi.alternatives().conditional('type', [
    {
      is: 'withPassword',
      then: Joi.string().pattern(passwordRegex).required(),
    },
    {
      is: 'withoutPassword',
      then: Joi.valid(null),
    },
  ]),
});

export {
  User,
  userSignupSchema,
  userLoginSchema,
  userEmailSchema,
  userPasswordSchema,
  userEditSchema,
};
