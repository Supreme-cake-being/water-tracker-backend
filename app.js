import express from 'express';
import logger from 'morgan';
import cors from 'cors';
import 'dotenv/config';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger.json' assert { type: 'json' };

import authRouter from './routes/api/auth.js';
import recordsRouter from './routes/api/records.js';

const app = express();

const formatsLogger = app.get('env') === 'development' ? 'dev' : 'short';

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());

app.use('/api/users', authRouter);
app.use('/api/records', recordsRouter);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.use((err, req, res, next) => {
  const { status = 500, message = 'Server error' } = err;
  res.status(status).json({ message });
});

export default app;
