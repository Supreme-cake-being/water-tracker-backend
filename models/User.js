import { Schema, model } from 'mongoose';
import Joi from 'joi';

const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

const userSchema = new Schema({
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
    token: String,
    verificationToken: {
        type: String,
        default: '',
    },
    verify: {
        type: Boolean,
        default: false,
    }
}, { versionKey: false, timestamps: true });

const User = model('user', userSchema);

const userSignupSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().pattern(emailRegex).required(),
    password: Joi.string().min(8).max(48).required(),
});

const userLoginSchema = Joi.object({
    email: Joi.string().pattern(emailRegex).required(),
    password: Joi.string().min(8).max(48).required(),
});

const userEmailSchema = Joi.object({
    email: Joi.string().pattern(emailRegex).required(),
});

export {
    User,
    userSignupSchema,
    userLoginSchema,
    userEmailSchema,
}