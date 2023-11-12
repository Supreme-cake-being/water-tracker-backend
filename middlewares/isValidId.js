import { isValidObjectId } from 'mongoose';

import { HttpError } from '../helpers/index.js';

const isValidId = (req, res, next) => {
  const { recordId } = req.params;
  if (!isValidObjectId(recordId)) {
    return next(HttpError(404, `Not found`));
  }
  next();
};

export default isValidId;
