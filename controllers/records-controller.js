import { ctrlWrapper } from '../decorators/index.js';
import Record from '../models/Record.js';

const getAll = async (req, res, next) => {
  const { _id: owner } = req.user;
  const { month } = req.body;

  const records = await Record.find({ owner, month });

  const tempResult = records.reduce((accumulator, record) => {
    if (!accumulator[record.day]) {
      return {
        ...accumulator,
        [record.day]: {
          day: record.day,
          overall: record.dosage,
          servings: 1,
        },
      };
    } else {
      return {
        ...accumulator,
        [record.day]: {
          day: record.day,
          overall: accumulator[record.day].overall + record.dosage,
          servings: accumulator[record.day].servings + 1,
        },
      };
    }
  }, {});

  const result = [...Object.values(tempResult)];

  res.json(result);
};

const getAllToday = async (req, res, next) => {
  const { _id: owner } = req.user;
  const { day, month } = req.body;

  const result = await Record.find({ owner, day, month });

  res.json(result);
};

const getById = async (req, res, next) => {
  const { _id: owner } = req.user;
  const { recordId } = req.params;

  const result = await Record.findOne({ _id: recordId, owner });
  if (!result) {
    throw HttpError(404, 'Not found');
  }

  res.json(result);
};

const add = async (req, res, next) => {
  const owner = req.user;

  const result = await Record.create({
    ...req.body,
    owner,
  });
  res.status(201).json(result);
};

const deleteById = async (req, res, next) => {
  const { _id: owner } = req.user;
  const { recordId } = req.params;

  const result = await Record.findOneAndDelete({ _id: recordId, owner });

  if (!result) {
    throw HttpError(404, 'Not found');
  }

  res.json({ message: 'Record deleted' });
};

const updateById = async (req, res, next) => {
  const { _id: owner } = req.user;
  const { recordId } = req.params;

  const result = await Record.findOneAndUpdate(
    { _id: recordId, owner },
    req.body
  );
  if (!result) {
    throw HttpError(404, 'Not found');
  }

  res.json(result);
};

export default {
  getAll: ctrlWrapper(getAll),
  getAllToday: ctrlWrapper(getAllToday),
  getById: ctrlWrapper(getById),
  add: ctrlWrapper(add),
  deleteById: ctrlWrapper(deleteById),
  updateById: ctrlWrapper(updateById),
};
