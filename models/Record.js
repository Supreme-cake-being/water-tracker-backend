import { Schema, model } from 'mongoose';
import Joi from 'joi';
import { handleSaveError, runValidatorsAtUpdate } from './hooks.js';

const errorMessages = {
  'string.base': '{#label} must be a string',
  'string.empty': '{#label} cannot be empty',
  'any.required': '{#label} is required',
};

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const recordSchema = new Schema(
  {
    dosage: {
      type: Number,
      required: [true, 'Dosage is required'],
    },
    time: {
      type: String,
      required: [true, 'Time is required'],
    },
    day: {
      type: Number,
      required: [true, 'Day is required'],
    },
    month: {
      type: String,
      enum: months,
      required: [true, 'Month is required'],
    },
    year: {
      type: Number,
      required: false,
    },
    // owner: {
    //   type: Schema.Types.ObjectId,
    //   ref: 'user',
    //   required: true,
    // },
  },
  {
    versionKey: false,
    timestamps: false,
  }
);

recordSchema.post('save', handleSaveError);

recordSchema.pre('findOneAndUpdate', runValidatorsAtUpdate);

recordSchema.post('findOneAndUpdate', handleSaveError);

export const recordAddSchema = Joi.object({
  dosage: Joi.number().min(1).required(),
  time: Joi.string().required(),
  day: Joi.number().min(1).max(31).required(),
  month: Joi.string()
    .valid(...months)
    .required(),
}).messages(errorMessages);

export const recordUpdateSchema = Joi.object({
  dosage: Joi.number().min(1).required(),
  time: Joi.string().required(),
});

const Record = model('record', recordSchema);

export default Record;
